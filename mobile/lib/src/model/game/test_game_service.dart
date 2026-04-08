import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../../utils/server_config.dart';

final testGameServiceProvider = Provider((ref) => TestGameService());

class TestGameService {
  /// Creates a test game with 3 bots and returns the game ID.
  Future<String> createTestGame({
    required String userId,
    required String displayName,
  }) async {
    // Convert ws:// → http:// for the REST call
    final baseUrl = serverUrl.replaceFirst(RegExp(r'^ws'), 'http');
    final uri = Uri.parse('$baseUrl/test-game').replace(
      queryParameters: {'userId': userId, 'displayName': displayName},
    );

    final response = await http.get(uri).timeout(const Duration(seconds: 5));
    if (response.statusCode != 200) {
      throw Exception('Server returned ${response.statusCode}');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    return body['gameId'] as String;
  }
}
