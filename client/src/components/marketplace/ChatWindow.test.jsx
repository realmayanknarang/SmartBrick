import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatWindow from './ChatWindow';

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import apiClient from '../../api/client';

const currentUserId = 'user-1';
const otherUserId = 'user-2';

function defineScrollMetrics(element, metrics) {
  Object.entries(metrics).forEach(([key, value]) => {
    Object.defineProperty(element, key, {
      configurable: true,
      value,
    });
  });
}

function renderChatWindow(props = {}) {
  return render(
    <ChatWindow
      conversationId="conversation-1"
      currentUserId={currentUserId}
      projectTitle="Kitchen Renovation"
      otherParticipantName="Rajesh Kumar"
      otherParticipantId={otherUserId}
      {...props}
    />
  );
}

describe('ChatWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    Element.prototype.scrollIntoView = vi.fn();
    apiClient.get.mockResolvedValue({
      data: {
        messages: [
          {
            _id: 'message-1',
            sender: { _id: otherUserId, name: 'Rajesh Kumar' },
            content: 'Hello, I have reviewed your project.',
            createdAt: '2026-07-08T10:00:00.000Z',
            readBy: [otherUserId],
          },
          {
            _id: 'message-2',
            sender: { _id: currentUserId, name: 'Mayank' },
            content: 'Great! When can you start?',
            createdAt: '2026-07-08T10:01:00.000Z',
            readBy: [currentUserId],
          },
        ],
      },
    });
    apiClient.post.mockResolvedValue({
      data: {
        message: {
          _id: 'message-3',
          sender: { _id: currentUserId, name: 'Mayank' },
          content: 'Tomorrow works.',
          createdAt: '2026-07-08T10:02:00.000Z',
          readBy: [currentUserId],
        },
      },
    });
  });

  it('renders sent and received bubbles with the expected alignment classes', async () => {
    renderChatWindow();

    const sentMessage = await screen.findByText('Great! When can you start?');
    const receivedMessage = screen.getByText('Hello, I have reviewed your project.');

    expect(sentMessage.closest('.chat-window__message')).toHaveClass('chat-window__message--sent');
    expect(sentMessage.closest('.chat-window__bubble')).toHaveClass('chat-window__bubble--sent');
    expect(receivedMessage.closest('.chat-window__message')).toHaveClass('chat-window__message--received');
    expect(receivedMessage.closest('.chat-window__bubble')).toHaveClass('chat-window__bubble--received');
  });

  it('fetches message history, joins the room, marks read, and scrolls after load', async () => {
    const joinConversation = vi.fn();
    const markRead = vi.fn();

    renderChatWindow({ joinConversation, markRead });

    expect(await screen.findByText('Hello, I have reviewed your project.')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/marketplace/messages/conversation-1');
    expect(joinConversation).toHaveBeenCalledWith('conversation-1');
    expect(markRead).toHaveBeenCalledWith('conversation-1');

    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
    });
  });

  it('shows skeleton bubbles while messages are loading', () => {
    apiClient.get.mockReturnValue(new Promise(() => {}));

    const { container } = renderChatWindow();

    expect(container.querySelectorAll('.chat-window__skeleton-row')).toHaveLength(6);
  });

  it('receives real-time messages for the active conversation and marks received messages read', async () => {
    let newMessageHandler;
    const markRead = vi.fn();
    renderChatWindow({
      markRead,
      onNewMessage: (handler) => {
        newMessageHandler = handler;
        return vi.fn();
      },
    });

    await screen.findByText('Great! When can you start?');
    markRead.mockClear();

    act(() => {
      newMessageHandler({
        _id: 'message-other-conversation',
        conversation: 'conversation-2',
        sender: { _id: otherUserId, name: 'Rajesh Kumar' },
        content: 'This should not render.',
        createdAt: '2026-07-08T10:03:00.000Z',
        readBy: [otherUserId],
      });
    });
    expect(screen.queryByText('This should not render.')).not.toBeInTheDocument();

    act(() => {
      newMessageHandler({
        message: {
          _id: 'message-4',
          conversation: 'conversation-1',
          sender: { _id: otherUserId, name: 'Rajesh Kumar' },
          content: 'I can start this week.',
          createdAt: '2026-07-08T10:04:00.000Z',
          readBy: [otherUserId],
        },
      });
    });

    expect(screen.getByText('I can start this week.')).toBeInTheDocument();
    expect(markRead).toHaveBeenCalledWith('conversation-1');
  });

  it('shows and clears the new-message nudge when a message arrives while scrolled up', async () => {
    let newMessageHandler;
    const { container } = renderChatWindow({
      onNewMessage: (handler) => {
        newMessageHandler = handler;
        return vi.fn();
      },
    });

    await screen.findByText('Great! When can you start?');

    const messageList = container.querySelector('.chat-window__messages');
    defineScrollMetrics(messageList, {
      scrollHeight: 1000,
      scrollTop: 100,
      clientHeight: 300,
    });

    act(() => {
      newMessageHandler({
        _id: 'message-5',
        conversation: 'conversation-1',
        sender: { _id: otherUserId, name: 'Rajesh Kumar' },
        content: 'Sharing a quick update.',
        createdAt: '2026-07-08T10:05:00.000Z',
        readBy: [otherUserId],
      });
    });

    expect(screen.getByText('↓ New message')).toBeInTheDocument();

    defineScrollMetrics(messageList, {
      scrollHeight: 1000,
      scrollTop: 650,
      clientHeight: 300,
    });
    fireEvent.scroll(messageList);

    expect(screen.queryByText('↓ New message')).not.toBeInTheDocument();
  });

  it('updates read receipts from real-time read events', async () => {
    let messagesReadHandler;
    renderChatWindow({
      onMessagesRead: (handler) => {
        messagesReadHandler = handler;
        return vi.fn();
      },
    });

    await screen.findByText('Great! When can you start?');
    expect(screen.getByLabelText('Sent')).toHaveTextContent('✓');

    act(() => {
      messagesReadHandler({ conversationId: 'conversation-1', readBy: otherUserId });
    });

    expect(screen.getByLabelText('Read')).toHaveTextContent('✓✓');
  });

  it('sends with Enter and keeps Shift+Enter for multiline drafts', async () => {
    const sendMessage = vi.fn().mockResolvedValue({
      _id: 'message-3',
      sender: { _id: currentUserId, name: 'Mayank' },
      content: 'Tomorrow works.',
      createdAt: '2026-07-08T10:02:00.000Z',
      readBy: [currentUserId],
    });
    renderChatWindow({ sendMessage });

    const textarea = await screen.findByPlaceholderText('Type a message...');

    fireEvent.change(textarea, { target: { value: 'Line one' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(sendMessage).not.toHaveBeenCalled();

    fireEvent.change(textarea, { target: { value: 'Tomorrow works.' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith('conversation-1', 'Tomorrow works.');
    });
  });

  it('hides the remote typing indicator after the safety timeout', async () => {
    let typingHandler;
    renderChatWindow({
      onTyping: (handler) => {
        typingHandler = handler;
        return vi.fn();
      },
    });

    await screen.findByText('Great! When can you start?');
    vi.useFakeTimers();

    act(() => {
      typingHandler({ conversationId: 'conversation-1', userId: otherUserId, isTyping: true });
    });
    expect(screen.getByText('Rajesh is typing...')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByText('Rajesh is typing...')).not.toBeInTheDocument();
  });

  it('ignores typing events from another conversation', async () => {
    let typingHandler;
    renderChatWindow({
      onTyping: (handler) => {
        typingHandler = handler;
        return vi.fn();
      },
    });

    await screen.findByText('Great! When can you start?');

    act(() => {
      typingHandler({ conversationId: 'conversation-2', userId: otherUserId, isTyping: true });
    });

    expect(screen.queryByText('Rajesh is typing...')).not.toBeInTheDocument();
  });
});
