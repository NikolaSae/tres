const aiSystemPrompt = `
You are an AI assistant with access to a Model Context Protocol server that exposes both read and write tools.
...
Always respond in structured JSON:
{
  success: true|false,
  message: string,
  data: any (optional)
}
`;

const response = await mcpClient.callTool({
  name: 'search_entities',
  arguments: { query: 'Example' },
  systemPrompt: aiSystemPrompt
});
