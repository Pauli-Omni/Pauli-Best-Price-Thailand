/// Zentrale Liste aller Übersetzungsschlüssel.
/// Hardcoding ist in der App verboten — jeder UI-String läuft über
/// `I18nService.t(I18nKeys.xxx)`.
class I18nKeys {
  I18nKeys._();

  // App / Navigation
  static const appTitle = 'app.title';
  static const navHome = 'nav.home';
  static const navCart = 'nav.cart';
  static const navAlerts = 'nav.alerts';
  static const navScanner = 'nav.scanner';
  static const navSettings = 'nav.settings';

  // Consent / AGB
  static const consentTitle = 'consent.title';
  static const consentBody = 'consent.body';
  static const consentCheckbox = 'consent.checkbox';
  static const consentAccept = 'consent.accept';
  static const consentDecline = 'consent.decline';
  static const consentDeclineTitle = 'consent.decline_title';
  static const consentDeclineLead = 'consent.decline_lead';
  static const consentDeclineDoorOpen = 'consent.decline_door_open';
  static const consentDeclineExit = 'consent.decline_exit';

  // Search
  static const searchHint = 'search.hint';
  static const searchButton = 'search.button';
  static const searchNoResults = 'search.no_results';
  static const searchError = 'search.error';

  // CTA
  static const ctaBuchen = 'cta.buchen';
  static const ctaKaufen = 'cta.kaufen';
  static const ctaAnfragen = 'cta.anfragen';

  // Trust-Badges
  static const trustVerified = 'trust.verified';
  static const trustWarning = 'trust.warning';
  static const trustPromo = 'trust.promo';
  static const trustCrossIndustry = 'trust.cross_industry';
  static const trustBanned = 'trust.banned';

  // Voice
  static const voiceNormal = 'voice.normal';
  static const voiceWhisper = 'voice.whisper';

  // Tracking
  static const trackOrdered = 'track.ordered';
  static const trackPacked = 'track.packed';
  static const trackInTransit = 'track.in_transit';
  static const trackAtSevenEleven = 'track.at_seven_eleven';
  static const trackPickedUp = 'track.picked_up';
  static const trackDeliveredHome = 'track.delivered_home';
  static const trackReturned = 'track.returned';

  /// Schlüssel für eine Hauptkategorie: `category.<id>`.
  static String category(String id) => 'category.$id';

  /// Schlüssel für eine Unterkategorie: `subcategory.<id>`.
  static String subCategory(String id) => 'subcategory.$id';
}
