import 'package:flutter_test/flutter_test.dart';
import 'package:pauli_best_price/services/audio_segment_service.dart';

void main() {
  test('segmentKeyFor maps speech keys', () {
    expect(
      AudioSegmentService.segmentKeyFor(speechKey: 'pauliSawadee'),
      'welcome_short',
    );
    expect(
      AudioSegmentService.segmentKeyFor(speechKey: 'search_processing'),
      'search_action',
    );
    expect(
      AudioSegmentService.segmentKeyFor(segmentKey: 'save_money'),
      'save_money',
    );
    expect(AudioSegmentService.segmentKeyFor(speechKey: 'unknown'), null);
  });
}
