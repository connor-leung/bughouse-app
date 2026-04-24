'use client';

import { useState, useEffect } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { useRouter } from 'next/navigation';
import { getUserId } from '@/lib/identity';
import { useGameSocket } from '@/lib/hooks/useGameSocket';
import { useChessClocks } from '@/lib/hooks/useChessClocks';
import { useBoardWidth } from '@/lib/hooks/useBoardWidth';
import { useGameStore } from '@/store/gameStore';
import { BoardRole, BoardSnapshot, clockIndex, opponentRole, partnerRole, roleBoard, roleColor } from '@/lib/types';
import InteractiveBoard from './InteractiveBoard';
import ReadOnlyBoard from './ReadOnlyBoard';
import ChessClock from './ChessClock';
import PieceBankBar from './PieceBankBar';
import TeamChat from './TeamChat';
import GameResultBanner from './GameResultBanner';
import Scoreboard from './Scoreboard';

interface Props {
  gameId: string;
}

function getActiveRoleForBoard(fen: string, boardNum: 1 | 2): BoardRole {
  let turn: 'w' | 'b' = 'w';
  try { turn = new Chess(fen).turn(); } catch { /* ignore */ }
  if (boardNum === 1) return turn === 'w' ? 'board1White' : 'board1Black';
  return turn === 'w' ? 'board2White' : 'board2Black';
}

const PIECE_SYMBOL: Record<string, PieceSymbol> = {
  queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p',
};

function applyOptimisticMove(snapshot: BoardSnapshot, from: string, to: string, promotion?: string): BoardSnapshot | null {
  try {
    const chess = new Chess(snapshot.fen);
    const promoSymbol = promotion ? (PIECE_SYMBOL[promotion] ?? promotion as PieceSymbol) : undefined;
    const result = chess.move({ from: from as Square, to: to as Square, promotion: promoSymbol });
    if (!result) return null;
    return { fen: chess.fen(), isCheck: false, lastFrom: from, lastTo: to };
  } catch { return null; }
}

function applyOptimisticDrop(snapshot: BoardSnapshot, pieceRole: string, to: string, color: 'white' | 'black'): BoardSnapshot | null {
  try {
    const chess = new Chess(snapshot.fen);
    const type = PIECE_SYMBOL[pieceRole];
    if (!type) return null;
    if (!chess.put({ type, color: color === 'white' ? 'w' : 'b' }, to as Square)) return null;
    const parts = chess.fen().split(' ');
    parts[1] = parts[1] === 'w' ? 'b' : 'w'; // flip turn
    return { fen: parts.join(' '), isCheck: false, lastFrom: undefined, lastTo: to };
  } catch { return null; }
}

export default function GameLayout({ gameId }: Props) {
  const router = useRouter();
  const userId = getUserId();
  const { sendMove, sendMove2, sendDrop, resign, sendMessage, sendRematch } = useGameSocket(gameId, userId);

  const gameState = useGameStore((s) => s.gameState);
  const gameResult = useGameStore((s) => s.gameResult);
  const myRole = useGameStore((s) => s.myRole);
  const chatMessages = useGameStore((s) => s.chatMessages);
  const isConnected = useGameStore((s) => s.isConnected);
  const error = useGameStore((s) => s.error);
  const rematchVotes = useGameStore((s) => s.rematchVotes);
  const pendingRematch = useGameStore((s) => s.pendingRematch);

  const [showChat, setShowChat] = useState(false);
  const [selectedDropPiece, setSelectedDropPiece] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [optimisticSnapshot, setOptimisticSnapshot] = useState<BoardSnapshot | null>(null);

  const { mainBoardWidth, partnerBoardWidth, isMobile } = useBoardWidth();
  const clocks = useChessClocks(gameState, !!gameResult);

  // Navigate to rematch game when all players vote
  useEffect(() => {
    if (pendingRematch && pendingRematch.gameId !== gameId) {
      router.push(`/game/${pendingRematch.gameId}`);
    }
  }, [pendingRematch, gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect home if the game no longer exists or can't be reached (and we never got game state)
  useEffect(() => {
    const isDeadEnd = error === 'game not found' || (!gameState && error === 'Connection error');
    if (isDeadEnd) {
      const t = setTimeout(() => router.push('/home'), 2000);
      return () => clearTimeout(t);
    }
  }, [error, gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear optimistic snapshot when server state arrives
  useEffect(() => { setOptimisticSnapshot(null); }, [gameState]);

  // Track unread chat
  useEffect(() => {
    if (!showChat) setUnread((n) => n + 1);
  }, [chatMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showChat) setUnread(0);
  }, [showChat]);

  if (!gameState || !myRole) {
    const isDeadEnd = error === 'game not found' || (!gameState && error === 'Connection error');
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg">{isDeadEnd ? 'Game not found' : isConnected ? 'Waiting for game state...' : 'Connecting...'}</p>
          {isDeadEnd
            ? <p className="text-gray-500 text-sm mt-2">Redirecting to home...</p>
            : error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  const myBoard = roleBoard(myRole);
  const myColor = roleColor(myRole);
  const orientation = myColor;

  const myBoardSnapshot = myBoard === 1 ? gameState.board1 : gameState.board2;
  const partnerBoardSnapshot = myBoard === 1 ? gameState.board2 : gameState.board1;

  const myBoardActiveRole = getActiveRoleForBoard(myBoardSnapshot.fen, myBoard);
  const isMyTurn = myBoardActiveRole === myRole;

  const partnerBoardNum: 1 | 2 = myBoard === 1 ? 2 : 1;
  const partnerRole_ = partnerRole(myRole);
  const partnerColor = roleColor(partnerRole_);

  // Clocks: index by role
  const myClock = clocks[clockIndex(myRole)];
  const opponentClock = clocks[clockIndex(opponentRole(myRole))];
  const partnerClock = clocks[clockIndex(partnerRole_)];

  // Banks
  const myBank = gameState.bank[myRole];
  const partnerBank = gameState.bank[partnerRole_];
  const opponentRole_ = opponentRole(myRole);
  const opponentBank = gameState.bank[opponentRole_];
  const opponentPartnerRole_ = partnerRole(opponentRole_);
  const opponentPartnerBank = gameState.bank[opponentPartnerRole_];

  function handleMove(from: string, to: string, promotion?: string) {
    if (myBoard === 1) sendMove(from, to, promotion);
    else sendMove2(from, to, promotion);
    setSelectedDropPiece(null);
    setOptimisticSnapshot(applyOptimisticMove(myBoardSnapshot, from, to, promotion));
  }

  function handleDrop(pieceRole: string, to: string) {
    sendDrop(myBoard === 1 ? '1' : '2', pieceRole, to);
    setSelectedDropPiece(null);
    setOptimisticSnapshot(applyOptimisticDrop(myBoardSnapshot, pieceRole, to, myColor));
  }

  function handleResign() {
    if (confirm('Are you sure you want to resign?')) resign();
  }

  // My board opponent name
  const opponent = gameState.players.find((p) => p.role === opponentRole(myRole));
  const me = gameState.players.find((p) => p.role === myRole);
  const partner = gameState.players.find((p) => p.role === partnerRole_);
  const oppPartner = gameState.players.find((p) => p.role === opponentPartnerRole_);
  const opponentPartnerClock = clocks[clockIndex(opponentPartnerRole_)];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-sm text-gray-500 font-mono">{gameId.slice(0, 8)}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${isConnected ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
            {isConnected ? 'Live' : '...'}
          </span>
          <button
            onClick={() => setShowChat((v) => !v)}
            className="relative bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          >
            Chat
            {unread > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {!gameResult && (
            <button
              onClick={handleResign}
              className="bg-red-900/60 hover:bg-red-800 rounded-lg px-3 py-1.5 text-sm text-red-300 font-medium transition-colors"
            >
              Resign
            </button>
          )}
        </div>
      </div>

      {/* Game result banner */}
      {gameResult && (
        <GameResultBanner
          result={gameResult}
          myRole={myRole}
          players={gameState?.players ?? []}
          rematchVotes={rematchVotes}
          onRematch={sendRematch}
        />
      )}

      {error && (
        <div className="bg-red-900/50 border-b border-red-800 px-4 py-2 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-auto">
        <div className={`flex-1 flex flex-col md:flex-row md:items-start md:justify-center gap-4 md:gap-8 p-4 ${showChat && !isMobile ? 'mr-80' : ''}`}>

          {/* Left column: my board */}
          <div className="flex items-stretch gap-2">
            {/* Clocks span full height (bank + board + bank) */}
            <div className="flex flex-col justify-between">
              <ChessClock ms={opponentClock} isActive={!isMyTurn && !gameResult} label={opponent?.displayName ?? 'Opponent'} />
              <ChessClock ms={myClock} isActive={isMyTurn && !gameResult} label={me?.displayName ?? 'You'} />
            </div>

            {/* Board with banks pinned above/below it */}
            <div className="flex flex-col">
              <div className="h-12 flex items-center">
                <PieceBankBar
                  bank={opponentBank}
                  color={roleColor(opponentRole_)}
                  selectedPiece={null}
                  onSelectPiece={() => {}}
                  disabled
                />
              </div>
              <InteractiveBoard
                snapshot={optimisticSnapshot ?? myBoardSnapshot}
                orientation={orientation}
                myColor={myColor}
                isMyTurn={isMyTurn && !gameResult}
                selectedDropPiece={selectedDropPiece}
                onMove={handleMove}
                onDrop={handleDrop}
                onClearDrop={() => setSelectedDropPiece(null)}
                boardWidth={mainBoardWidth}
              />
              <div className="h-12 flex items-center">
                <PieceBankBar
                  bank={myBank}
                  color={myColor}
                  selectedPiece={selectedDropPiece}
                  onSelectPiece={setSelectedDropPiece}
                  disabled={!isMyTurn || !!gameResult}
                />
              </div>
            </div>
          </div>

          {/* Right column: partner board */}
          <div className="flex flex-col gap-2 border-t border-gray-800 pt-4 md:border-0 md:pt-0">
            <div className="flex items-stretch gap-2">
              {/* Board with banks pinned above/below it */}
              <div className="flex flex-col">
                <div className="h-12 flex items-center">
                  <PieceBankBar
                    bank={opponentPartnerBank}
                    color={roleColor(opponentPartnerRole_)}
                    selectedPiece={null}
                    onSelectPiece={() => {}}
                    disabled
                  />
                </div>
                <ReadOnlyBoard
                  snapshot={partnerBoardSnapshot}
                  orientation={partnerColor}
                  boardWidth={partnerBoardWidth}
                />
                <div className="h-12 flex items-center">
                  <PieceBankBar
                    bank={partnerBank}
                    color={partnerColor}
                    selectedPiece={null}
                    onSelectPiece={() => {}}
                    disabled
                  />
                </div>
              </div>

              {/* Clocks span full height (bank + board + bank) */}
              <div className="flex flex-col justify-between">
                <ChessClock
                  ms={opponentPartnerClock}
                  isActive={getActiveRoleForBoard(partnerBoardSnapshot.fen, partnerBoardNum) !== partnerRole_ && !gameResult}
                  label={oppPartner?.displayName ?? 'Opp. Partner'}
                />
                <ChessClock
                  ms={partnerClock}
                  isActive={getActiveRoleForBoard(partnerBoardSnapshot.fen, partnerBoardNum) === partnerRole_ && !gameResult}
                  label={partner?.displayName ?? 'Partner'}
                />
              </div>
            </div>

            <Scoreboard players={gameState.players} scores={gameState.scores} myUserId={userId} />
          </div>

        </div>
      </div>

      {/* Chat panel */}
      {showChat && (
        <TeamChat
          messages={chatMessages}
          myUserId={userId}
          onSend={sendMessage}
          onClose={() => setShowChat(false)}
          isMobile={isMobile}
        />
      )}

    </div>
  );
}
