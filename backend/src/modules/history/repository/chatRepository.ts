import { prisma } from "@/app/config/prisma";

import { Prisma } from "../../../generated/client/client";

export const chatRepository = {
  // --- Thread Operations ---

  async createThread(title: string) {
    return prisma.chatThread.create({
      data: {
        title,
      },
    });
  },

  async findThread(id: string) {
    return prisma.chatThread.findUnique({
      where: { id },
    });
  },

  async getThreads() {
    return prisma.chatThread.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    });
  },

  async updateThread(id: string, data: Prisma.ChatThreadUpdateInput) {
    return prisma.chatThread.update({
      where: { id },
      data,
    });
  },

  async deleteThread(id: string) {
    return prisma.chatThread.delete({
      where: { id },
    });
  },

  // --- Message Operations ---

  async createMessage(data: Prisma.ChatMessageUncheckedCreateInput) {
    return prisma.chatMessage.create({
      data,
    });
  },

  async updateMessageContent(id: string, content: string) {
    return prisma.chatMessage.update({
      where: { id },
      data: { content },
    });
  },

  async getMessages(threadId: string) {
    return prisma.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    });
  },
};
