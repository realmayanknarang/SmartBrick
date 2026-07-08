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
            readBy: [currentUserId, otherUserId],
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

  it('shows skeleton bubbles while messages are loading', () => {
    apiClient.get.mockReturnValue(new Promise(() => {}));

    const { container } = renderChatWindow();

    expect(container.querySelectorAll('.chat-window__skeleton-row')).toHaveLength(6);
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
});
