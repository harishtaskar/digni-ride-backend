import { Router } from 'express';
import { RequestController } from './request.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const requestController = new RequestController();

// All routes are protected
router.post('/rides/:rideId/request', authenticate, requestController.createRequest.bind(requestController));
router.get('/rides/:rideId/requests', authenticate, requestController.getRideRequests.bind(requestController));
router.post('/requests/:requestId/accept', authenticate, requestController.acceptRequest.bind(requestController));
router.post('/requests/:requestId/reject', authenticate, requestController.rejectRequest.bind(requestController));
router.get('/requests/me', authenticate, requestController.getMyRequests.bind(requestController));
router.delete('/requests/:requestId', authenticate, requestController.cancelRequest.bind(requestController));

export default router;
