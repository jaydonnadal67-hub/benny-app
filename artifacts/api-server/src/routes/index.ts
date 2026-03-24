import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bennyRouter from "./benny";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bennyRouter);

export default router;
