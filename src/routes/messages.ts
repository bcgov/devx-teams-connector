import { Router } from 'express';

import { validateSendMessageRequest } from '../validation/schemas';
import type { MessageService } from '../services/messageService';

export function createMessagesRouter(messageService: MessageService): Router {
  const router = Router();

  router.post('/messages', async (req, res, next) => {
    try {
      const validatedRequest = validateSendMessageRequest(req.body);
      const userEntraId = String(res.locals.userEntraId);
      const accepted = await messageService.send(validatedRequest, userEntraId);

      res.status(202).json(accepted);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
