import config from '../config/environment.js';
import { syncKeycloakSmtpConfig, testKeycloakSmtpConnection } from '../services/keycloakService.js';

async function main() {
  console.log('====================================================');
  console.log('  Keycloak Realm SMTP Synchronizer');
  console.log('====================================================');
  console.log(`  Target Realm : ${config.keycloak.realm}`);
  console.log(`  Keycloak URL : ${config.keycloak.serverUrl}`);
  console.log(`  SMTP Host    : ${config.keycloak.smtp.host}`);
  console.log(`  SMTP Port    : ${config.keycloak.smtp.port}`);
  console.log(`  SMTP From    : ${config.keycloak.smtp.from}`);
  console.log(`  SMTP Auth    : ${config.keycloak.smtp.auth}`);
  console.log(`  SMTP User    : ${config.keycloak.smtp.user ? config.keycloak.smtp.user : '(none)'}`);
  console.log(`  SMTP Pass    : ${config.keycloak.smtp.password ? '******** (configured)' : '(none)'}`);
  console.log('----------------------------------------------------');

  console.log('[1/2] Synchronizing Keycloak realm SMTP configuration...');
  const syncResult = await syncKeycloakSmtpConfig();
  if (!syncResult.synced) {
    console.error('❌ Failed to synchronize SMTP configuration:', syncResult.error);
    process.exit(1);
  }
  console.log('✔ SMTP configuration successfully applied to Keycloak realm!');

  console.log('[2/2] Testing SMTP connection with Keycloak...');
  const testResult = await testKeycloakSmtpConnection();
  if (testResult.success) {
    console.log('✔ SMTP connection verified successfully!');
    console.log('====================================================');
    console.log('  Ready for email verification delivery.');
    console.log('====================================================');
  } else {
    console.warn('⚠️ SMTP test connection returned a warning/failure:');
    console.warn(`  ${testResult.message}`);
    console.log('----------------------------------------------------');
    console.log('Note: If using Mailpit, check that Mailpit container is running on port 1025.');
    console.log('If using Gmail SMTP, verify 2-Step Verification and Google App Password.');
  }
}

main().catch((err) => {
  console.error('Fatal error during SMTP synchronization:', err?.message || err);
  process.exit(1);
});
