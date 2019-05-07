import React from "react";
import hot from "../../.fusion/scripts/hot";
import { registerApp } from "../../.fusion/scripts/register";

const HelloWorld = () => <div>Hello world smud!</div>;

registerApp("hello-world", {
  AppComponent: hot(HelloWorld)
});

if (module.hot) {
  module.hot.accept();
}
