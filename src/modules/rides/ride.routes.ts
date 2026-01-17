import { Router } from 'express';
import { RideController } from './ride.controller';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();
const rideController = new RideController();

// Public/optional auth routes
router.get('/', optionalAuth, rideController.getRides.bind(rideController));
router.get(
  "/:id",
  optionalAuth,
  rideController.getRideById.bind(rideController),
);

// Protected routes
router.post('/', authenticate, rideController.createRide.bind(rideController));
router.post('/:id/complete', authenticate, rideController.completeRide.bind(rideController));
router.delete('/:id', authenticate, rideController.cancelRide.bind(rideController));
router.get('/me/created', authenticate, rideController.getMyCreatedRides.bind(rideController));
router.get('/me/joined', authenticate, rideController.getMyJoinedRides.bind(rideController));

export default router;
