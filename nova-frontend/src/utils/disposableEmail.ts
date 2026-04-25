// Top disposable / temp-mail providers. Catches the common throwaway services.
// Source: curated from disposable-email-domains/disposable-email-domains.
const DISPOSABLE_DOMAINS = new Set<string>([
  '0815.ru', '0wnd.net', '10minutemail.com', '10minutemail.net', '10minutemail.org',
  '10minutemail.de', '20minutemail.com', '30minutemail.com', '20mail.it',
  'anonbox.net', 'anonymbox.com', 'antichef.net',
  'bccto.me', 'beefmilk.com', 'binkmail.com', 'bobmail.info', 'boun.cr', 'bsnow.net',
  'burnermail.io', 'byom.de',
  'crazymailing.com',
  'discardmail.com', 'discard.email', 'disposablemail.com', 'dispostable.com',
  'dropmail.me',
  'easytrashmail.com', 'einrot.com', 'emailfake.com', 'emailondeck.com',
  'fakeinbox.com', 'fakemailgenerator.com', 'fakemail.net', 'fakeinbox.net',
  'getairmail.com', 'getnada.com', 'guerrillamail.com', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamail.biz', 'guerrillamail.de', 'guerrillamailblock.com',
  'harakirimail.com',
  'inboxbear.com', 'inboxkitten.com', 'incognitomail.com', 'incognitomail.net',
  'jetable.org',
  'koszmail.pl',
  'mail-temporaire.fr', 'mail.tm', 'mail7.io', 'mailcatch.com', 'maildrop.cc',
  'mailinator.com', 'mailinator.net', 'mailinator.org', 'mailinator2.com',
  'mailnesia.com', 'mailnull.com', 'mailtemp.info', 'mailtothis.com', 'mailmoat.com',
  'meltmail.com', 'mintemail.com', 'mohmal.com', 'moakt.com', 'moakt.cc', 'mvrht.com',
  'nada.email', 'no-spam.ws', 'noclickemail.com', 'nodez.eu', 'nomail.xl.cx',
  'nowmymail.com',
  'objectmail.com', 'oneoffmail.com', 'opayq.com', 'opentrash.com',
  'pokemail.net', 'putthisinyourspamdatabase.com',
  'rcpt.at', 'redirect2mail.com', 'rmqkr.net',
  'sharklasers.com', 'shitmail.me', 'shitmail.org', 'sneakemail.com', 'snkmail.com',
  'spam4.me', 'spambog.com', 'spambox.us', 'spamcero.com', 'spamfree24.org',
  'spamgourmet.com', 'spamhole.com', 'spaml.com', 'speed.1s.fr',
  'tempail.com', 'tempemail.com', 'tempemail.net', 'tempinbox.com', 'tempmail.com',
  'tempmail.de', 'tempmail.org', 'tempmail.email', 'tempmail.eu', 'tempmail.io',
  'tempmail.it', 'tempmail.net', 'tempmail.plus', 'tempmail.ru', 'tempmailaddress.com',
  'tempmail2.com', 'tempr.email', 'temp-mail.com', 'temp-mail.io', 'temp-mail.org',
  'temp-mail.de', 'temp-mail.fr', 'temp-mail.ru', 'thrott.com', 'throwam.com',
  'throwawaymail.com', 'tmpemail.com', 'tmpmail.net', 'tmpmail.org', 'tmpbox.net',
  'tokenmail.de', 'trashmail.com', 'trashmail.de', 'trashmail.io', 'trashmail.me',
  'trashmail.net', 'trashmail.ws', 'trillianpro.com', 'tyldd.com',
  'wegwerfemail.com', 'wegwerfemail.de', 'wegwerfmail.de', 'wegwerfmail.net',
  'wuzup.net', 'wuzupmail.net',
  'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'zetmail.com',
]);

export const isDisposableEmail = (email: string): boolean => {
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
};
