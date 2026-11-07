import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freshmart_staff/main.dart';

void main() {
  testWidgets('FreshMart staff app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: FreshMartStaffApp(),
      ),
    );
    expect(find.byType(FreshMartStaffApp), findsOneWidget);
  });
}
