import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth-turso", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db-turso", () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { GET as getRooms, POST as createRoom } from "../chat/rooms/route";
import {
  GET as getMessages,
  POST as sendMessage,
} from "../chat/messages/route";
import { db } from "@/lib/db-turso";

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };

const userSession = {
  user: {
    id: "user-1",
    name: "Maria",
    role: "FAMILY",
    email: "maria@test.com",
  },
};

describe("Chat Rooms API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/chat/rooms", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/chat/rooms");
      const res = await getRooms(req);
      expect(res.status).toBe(401);
    });

    it("returns chat rooms for authenticated user", async () => {
      mockGetServerSession.mockResolvedValue(userSession);
      mockDb.execute.mockResolvedValue({
        rows: [
          {
            id: "room_1",
            type: "direct",
            referenceType: null,
            referenceId: null,
            isActive: 1,
            createdAt: "2025-02-28",
            lastReadAt: "2025-02-28",
            unreadCount: 2,
            participant_id: "user-2",
            participant_name: "João",
            participant_role: "CAREGIVER",
            participant_title: "Cuidador",
            last_message_content: "Olá!",
            last_message_at: "2025-02-28T10:00:00",
            last_message_sender_id: "user-2",
          },
        ],
      });

      const req = new NextRequest("http://localhost:3000/api/chat/rooms");
      const res = await getRooms(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.chatRooms).toHaveLength(1);
      expect(data.chatRooms[0].participant.name).toBe("João");
      expect(data.chatRooms[0].unreadCount).toBe(2);
      expect(data.chatRooms[0].lastMessage.content).toBe("Olá!");
    });
  });

  describe("POST /api/chat/rooms", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: "user-2" }),
      });
      const res = await createRoom(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 when participantId is missing", async () => {
      mockGetServerSession.mockResolvedValue(userSession);

      const req = new NextRequest("http://localhost:3000/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const res = await createRoom(req);
      expect(res.status).toBe(400);
    });

    it("returns existing room if already exists", async () => {
      mockGetServerSession.mockResolvedValue(userSession);
      mockDb.execute.mockResolvedValue({
        rows: [{ id: "room_existing" }],
      });

      const req = new NextRequest("http://localhost:3000/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: "user-2" }),
      });
      const res = await createRoom(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.chatRoomId).toBe("room_existing");
      expect(data.message).toBe("Chat room already exists");
    });

    it("creates a new room with participants", async () => {
      mockGetServerSession.mockResolvedValue(userSession);
      // No existing room
      mockDb.execute
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({ rows: [] });

      const req = new NextRequest("http://localhost:3000/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: "user-2" }),
      });
      const res = await createRoom(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.chatRoomId).toMatch(/^room_/);
      expect(data.message).toBe("Chat room created successfully");

      // 1: check existing, 2: create room, 3: add participant 1, 4: add participant 2
      expect(mockDb.execute).toHaveBeenCalledTimes(4);
    });
  });
});

describe("Chat Messages API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/chat/messages", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/chat/messages?chatRoomId=room_1",
      );
      const res = await getMessages(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 when chatRoomId is missing", async () => {
      mockGetServerSession.mockResolvedValue(userSession);

      const req = new NextRequest("http://localhost:3000/api/chat/messages");
      const res = await getMessages(req);
      expect(res.status).toBe(400);
    });

    it("returns 403 when user is not participant", async () => {
      mockGetServerSession.mockResolvedValue(userSession);
      mockDb.execute.mockResolvedValue({ rows: [] }); // no participant found

      const req = new NextRequest(
        "http://localhost:3000/api/chat/messages?chatRoomId=room_1",
      );
      const res = await getMessages(req);
      expect(res.status).toBe(403);
    });

    it("returns messages for valid participant", async () => {
      mockGetServerSession.mockResolvedValue(userSession);
      mockDb.execute
        .mockResolvedValueOnce({ rows: [{ id: "cp-1" }] }) // participant check
        .mockResolvedValueOnce({
          rows: [
            {
              id: "msg_2",
              chatRoomId: "room_1",
              senderId: "user-2",
              sender_name: "João",
              sender_role: "CAREGIVER",
              content: "Bom dia!",
              messageType: "text",
              metadata: null,
              isEdited: 0,
              createdAt: "2025-02-28T10:00:00",
            },
            {
              id: "msg_1",
              chatRoomId: "room_1",
              senderId: "user-1",
              sender_name: "Maria",
              sender_role: "FAMILY",
              content: "Olá!",
              messageType: "text",
              metadata: null,
              isEdited: 0,
              createdAt: "2025-02-28T09:00:00",
            },
          ],
        });

      const req = new NextRequest(
        "http://localhost:3000/api/chat/messages?chatRoomId=room_1",
      );
      const res = await getMessages(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.messages).toHaveLength(2);
      // Messages reversed to oldest first
      expect(data.messages[0].content).toBe("Olá!");
      expect(data.messages[1].content).toBe("Bom dia!");
    });
  });

  describe("POST /api/chat/messages", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatRoomId: "room_1", content: "Hello" }),
      });
      const res = await sendMessage(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid message", async () => {
      mockGetServerSession.mockResolvedValue(userSession);

      const req = new NextRequest("http://localhost:3000/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatRoomId: "room_1", content: "" }),
      });
      const res = await sendMessage(req);
      expect(res.status).toBe(400);
    });

    it("returns 403 when not participant", async () => {
      mockGetServerSession.mockResolvedValue(userSession);
      mockDb.execute.mockResolvedValue({ rows: [] });

      const req = new NextRequest("http://localhost:3000/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatRoomId: "room_1", content: "Hello" }),
      });
      const res = await sendMessage(req);
      expect(res.status).toBe(403);
    });

    it("sends message and updates room state", async () => {
      mockGetServerSession.mockResolvedValue(userSession);
      mockDb.execute
        .mockResolvedValueOnce({ rows: [{ id: "cp-1" }] }) // participant check
        .mockResolvedValue({ rows: [] }); // insert + updates

      const req = new NextRequest("http://localhost:3000/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatRoomId: "room_1", content: "Olá João!" }),
      });
      const res = await sendMessage(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message.content).toBe("Olá João!");
      expect(data.message.senderId).toBe("user-1");
      expect(data.message.senderName).toBe("Maria");
      expect(data.message.id).toMatch(/^msg_/);

      // 1: participant check, 2: insert message, 3: update room, 4: increment unread
      expect(mockDb.execute).toHaveBeenCalledTimes(4);
    });
  });
});
