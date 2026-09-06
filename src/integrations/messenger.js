const missingConfiguration = () => {
  throw new Error('Messenger connector is not configured yet. Add a provider adapter and credentials before enabling it.');
};

/**
 * Provider-neutral boundary for the future messenger integration.
 * Every mutating operation should be surfaced to the approval queue first.
 */
export function createMessengerConnector({ baseUrl, token } = {}) {
  if (!baseUrl || !token) {
    return {
      status: 'not-configured',
      listConversations: missingConfiguration,
      getConversation: missingConfiguration,
      sendMessage: missingConfiguration,
    };
  }

  const request = async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Messenger request failed with status ${response.status}`);
    }

    return response.json();
  };

  return {
    status: 'configured',
    listConversations: () => request('/conversations'),
    getConversation: (conversationId) => request(`/conversations/${conversationId}`),
    sendMessage: (conversationId, body) => request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  };
}
