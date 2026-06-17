import { Router } from 'express';

import { validateSendMessageRequest } from '../validation/schemas';
import type { MessageService } from '../services/messageService';

export interface MessagesRouterOptions {
  allowCardPassthrough?: boolean;
}

export function createMessagesRouter(
  messageService: MessageService,
  options: MessagesRouterOptions = {},
): Router {
  const router = Router();
  const validateOptions = { allowCardPassthrough: options.allowCardPassthrough };

  router.post('/messages', async (req, res, next) => {
    try {
      const validatedRequest = validateSendMessageRequest(req.body, validateOptions);
      const accepted = await messageService.send(validatedRequest);

      res.status(201).json(accepted);
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages/preview', async (req, res, next) => {
    try {
      const validatedRequest = validateSendMessageRequest(req.body, validateOptions);
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
