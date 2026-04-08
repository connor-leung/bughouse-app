import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kDisplayNameKey = 'display_name';
const _kUserIdKey = 'user_id';

// ---------------------------------------------------------------------------
// Shared preferences instance
// ---------------------------------------------------------------------------

final sharedPreferencesProvider = FutureProvider<SharedPreferences>((ref) {
  return SharedPreferences.getInstance();
});

// ---------------------------------------------------------------------------
// User identity
// ---------------------------------------------------------------------------

final userPreferencesProvider =
    AsyncNotifierProvider<UserPreferencesNotifier, UserPrefs>(
  UserPreferencesNotifier.new,
);

final hasDisplayNameProvider = Provider<bool>((ref) {
  return ref
      .watch(userPreferencesProvider)
      .maybeWhen(data: (p) => p.displayName.isNotEmpty, orElse: () => false);
});

class UserPrefs {
  const UserPrefs({required this.userId, required this.displayName});

  final String userId;
  final String displayName;
}

class UserPreferencesNotifier extends AsyncNotifier<UserPrefs> {
  @override
  Future<UserPrefs> build() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString(_kDisplayNameKey) ?? '';
    var userId = prefs.getString(_kUserIdKey) ?? '';
    if (userId.isEmpty) {
      userId = _generateId();
      await prefs.setString(_kUserIdKey, userId);
    }
    return UserPrefs(userId: userId, displayName: name);
  }

  Future<void> setDisplayName(String name) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kDisplayNameKey, name.trim());
    state = AsyncData(
      UserPrefs(
        userId: state.value?.userId ?? _generateId(),
        displayName: name.trim(),
      ),
    );
  }

  String _generateId() {
    final now = DateTime.now().millisecondsSinceEpoch;
    return 'u_$now';
  }
}
