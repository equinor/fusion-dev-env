import React from "react";
import hot from "../../.fusion/scripts/hot";
import { registerApp } from "../../.fusion/scripts/register";

const HelloWorld = () => <div>Martin</div>;

registerApp("hello-world", {
  AppComponent: hot(HelloWorld)
});

if (module.hot) {
  module.hot.accept();
}
