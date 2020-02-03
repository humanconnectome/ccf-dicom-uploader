import Vue from "vue";
import VueRouter from "vue-router";
import Servers from "../views/Servers";
import Options from "../views/Options";
import Upload from "../views/Upload";

Vue.use(VueRouter);

const routes = [
  {
    path: "/servers",
    name: "servers",
    component: Servers
  },
  {
    path: "/options",
    name: "options",
    component: Options
  },
  {
    path: "/upload",
    name: "upload",
    component: Upload
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
