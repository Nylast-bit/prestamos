"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/consolidacionCapital.routes.ts
const express_1 = require("express");
const consolidacioncapital_controller_1 = require("../controllers/consolidacioncapital.controller");
const validate_1 = require("../middlewares/validate");
const consolidacioncapital_validator_1 = require("../validators/consolidacioncapital.validator");
const router = (0, express_1.Router)();
router.get("/", consolidacioncapital_controller_1.getAllConsolidacionesCapital);
router.get("/:id", consolidacioncapital_controller_1.getConsolidacionCapitalById);
router.post("/", (0, validate_1.validate)(consolidacioncapital_validator_1.consolidacionCapitalSchema), consolidacioncapital_controller_1.createConsolidacionCapital);
router.put("/:id", (0, validate_1.validate)(consolidacioncapital_validator_1.consolidacionCapitalSchema), consolidacioncapital_controller_1.updateConsolidacionCapital);
router.delete("/:id", consolidacioncapital_controller_1.deleteConsolidacionCapital);
exports.default = router;
