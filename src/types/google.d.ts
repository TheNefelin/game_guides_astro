declare namespace google.accounts.oauth2 {
  function initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: { access_token?: string; error?: string }) => void;
  }): {
    requestAccessToken: () => void;
  };
}
