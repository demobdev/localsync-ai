export function googleOAuthErrorMessage(error: string) {
  switch (error) {
    case "not_configured":
      return "Google connection is not configured for this environment yet. An administrator needs to check the OAuth client and callback URL.";
    case "access_denied":
      return "Google authorization was canceled or permission was not granted. Your existing connection has not been changed. Try connecting again when you’re ready.";
    case "missing_code":
      return "Google did not return an authorization code. The connection was not completed. Start a new connection attempt.";
    case "state_mismatch":
      return "This connection attempt expired or no longer matches your signed-in workspace. Return to the workspace you want to connect and start again.";
    case "exchange_failed":
      return "LocalSync could not finish authorization with Google. Your existing connection has not been changed. Start a new connection attempt; if it keeps failing, ask an administrator to check the OAuth client and callback URL.";
    case "save_failed":
      return "Google authorized the connection, but LocalSync could not save it. Try connecting again.";
    case "search_location_unavailable":
      return "The business selected for Search Console is no longer available in this workspace. Return to your businesses and start again.";
    case "search_setup_failed":
      return "Your Google account is connected, but Search Console setup or its first data sync did not finish. Check that this business has a website and your Google account can access its Search Console property, then retry from the business’s Search Intelligence page.";
    default:
      return "Google authorization did not finish. Start a new connection attempt. If it keeps failing, ask an administrator to check the connection settings.";
  }
}
