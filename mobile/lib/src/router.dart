import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'model/user/user_preferences.dart';
import 'view/home/home_screen.dart';
import 'view/user/name_entry_screen.dart';
import 'view/user/profile_screen.dart';
import 'view/lobby/lobby_list_screen.dart';
import 'view/lobby/lobby_room_screen.dart';
import 'view/game/game_screen.dart';
import 'view/game/debug_game_screen.dart';
import 'view/game/local_two_player_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final hasName = ref.watch(hasDisplayNameProvider);

  return GoRouter(
    initialLocation: hasName ? '/home' : '/name-entry',
    redirect: (context, state) {
      final onNameEntry = state.matchedLocation == '/name-entry';
      if (!hasName && !onNameEntry) return '/name-entry';
      if (hasName && onNameEntry) return '/home';
      return null;
    },
    routes: [
      GoRoute(
        path: '/name-entry',
        builder: (context, state) => const NameEntryScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/lobbies',
        builder: (context, state) => const LobbyListScreen(),
      ),
      GoRoute(
        path: '/lobby/:id',
        builder: (context, state) =>
            LobbyRoomScreen(lobbyId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/game/:id',
        builder: (context, state) =>
            GameScreen(gameId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/debug',
        builder: (context, state) => const DebugGameScreen(),
      ),
      GoRoute(
        path: '/local-2p',
        builder: (context, state) => const LocalTwoPlayerScreen(),
      ),
    ],
  );
});
