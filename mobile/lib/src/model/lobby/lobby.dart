// Lobby data model — plain Dart (no codegen needed at this stage)

enum BoardRole { board1White, board1Black, board2White, board2Black }

enum LobbyStatus { waiting, starting, inProgress, finished }

class PlayerSlot {
  const PlayerSlot({
    required this.userId,
    required this.displayName,
    required this.role,
  });

  final String userId;
  final String displayName;
  final BoardRole role;

  int get team => (role == BoardRole.board1White || role == BoardRole.board2Black) ? 1 : 2;

  factory PlayerSlot.fromJson(Map<String, dynamic> json) => PlayerSlot(
        userId: json['userId'] as String,
        displayName: json['displayName'] as String,
        role: BoardRole.values.firstWhere((r) => r.name == json['role']),
      );

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'displayName': displayName,
        'role': role.name,
      };
}

class TimeControl {
  const TimeControl({required this.minutes, required this.incrementSeconds});

  final int minutes;
  final int incrementSeconds;

  String get label => incrementSeconds > 0
      ? '${minutes}+$incrementSeconds'
      : '$minutes min';

  factory TimeControl.fromJson(Map<String, dynamic> json) => TimeControl(
        minutes: json['minutes'] as int,
        incrementSeconds: json['incrementSeconds'] as int,
      );

  Map<String, dynamic> toJson() => {
        'minutes': minutes,
        'incrementSeconds': incrementSeconds,
      };

  static const presets = [
    TimeControl(minutes: 1, incrementSeconds: 0),
    TimeControl(minutes: 2, incrementSeconds: 1),
    TimeControl(minutes: 3, incrementSeconds: 0),
    TimeControl(minutes: 5, incrementSeconds: 0),
    TimeControl(minutes: 10, incrementSeconds: 0),
  ];
}

class Lobby {
  const Lobby({
    required this.id,
    required this.name,
    required this.hostUserId,
    required this.slots,
    required this.timeControl,
    required this.status,
  });

  final String id;
  final String name;
  final String hostUserId;
  final List<PlayerSlot?> slots; // always length 4, null = empty
  final TimeControl timeControl;
  final LobbyStatus status;

  int get filledSlots => slots.where((s) => s != null).length;
  bool get isFull => filledSlots == 4;

  factory Lobby.fromJson(Map<String, dynamic> json) => Lobby(
        id: json['id'] as String,
        name: json['name'] as String,
        hostUserId: json['hostUserId'] as String,
        slots: (json['slots'] as List<dynamic>)
            .map((s) => s == null ? null : PlayerSlot.fromJson(s as Map<String, dynamic>))
            .toList(),
        timeControl: TimeControl.fromJson(json['timeControl'] as Map<String, dynamic>),
        status: LobbyStatus.values.firstWhere((s) => s.name == json['status']),
      );
}
