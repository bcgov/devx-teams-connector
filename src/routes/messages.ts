import { Router } from 'express';

import { validateSendMessageRequest } from '../validation/schemas';
import type { MessageService } from '../services/messageService';

export function createMessagesRouter(messageService: MessageService): Router {
  const router = Router();

  router.post('/messages', async (req, res, next) => {
    try {
      const validatedRequest = validateSendMessageRequest(req.body);
      const accepted = await messageService.send(validatedRequest);

      res.status(202).json(accepted);
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages/preview', async (req, res, next) => {
    try {
      const validatedRequest = validateSendMessageRequest(req.body);
      const payload = messageService.preview(validatedRequest);

      res.status(200).json({
        mode: 'preview',
        payload,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
