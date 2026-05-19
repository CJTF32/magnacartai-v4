import { onRequestPost as __api_convention_init_js_onRequestPost } from "/Users/conorfarrington/magnacartai-v4/functions/api/convention/init.js"
import { onRequestPost as __api_convention_register_js_onRequestPost } from "/Users/conorfarrington/magnacartai-v4/functions/api/convention/register.js"
import { onRequestPost as __api_convention_turn_js_onRequestPost } from "/Users/conorfarrington/magnacartai-v4/functions/api/convention/turn.js"

export const routes = [
    {
      routePath: "/api/convention/init",
      mountPath: "/api/convention",
      method: "POST",
      middlewares: [],
      modules: [__api_convention_init_js_onRequestPost],
    },
  {
      routePath: "/api/convention/register",
      mountPath: "/api/convention",
      method: "POST",
      middlewares: [],
      modules: [__api_convention_register_js_onRequestPost],
    },
  {
      routePath: "/api/convention/turn",
      mountPath: "/api/convention",
      method: "POST",
      middlewares: [],
      modules: [__api_convention_turn_js_onRequestPost],
    },
  ]