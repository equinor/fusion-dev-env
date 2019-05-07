import React, { useState, useEffect } from "react";
import { render } from "@hot-loader/react-dom";

import { registerAppListener } from "../scripts/register";

const AppWrapper = () => {
  const [appKey] = useState("hello-world");
  const [manifest, setManifest] = useState({});

  useEffect(() => {
    const unregisterAppListener = registerAppListener(
      (registeredAppKey, manifest) => {
        updateManifest(registeredAppKey, {
          ...manifest,
          failedToLoadAppBundle: false,
          isLoading: false
        });
      }
    );

    return () => {
      unregisterAppListener();
    };
  }, [appKey]);

  const updateManifest = (appKey, manifest) => {
    const existingManifest = getManifest(appKey);

    setManifest(prevManifest => ({
      ...prevManifest,
      [appKey]: {
        ...(existingManifest || {}),
        ...manifest
      }
    }));
  };

  const getManifest = appKey => {
    return manifest[appKey];
  };

  const getCurrentManifest = () => {
    return getManifest(appKey);
  };

  const getCurrentAppComponent = () => {
    const currentManifest = getCurrentManifest();

    if (!currentManifest) {
      return null;
    }

    return currentManifest.AppComponent;
  };

  const AppComponent = getCurrentAppComponent();
  if (!AppComponent) {
    return null;
  }

  return <AppComponent />;
};

render(<AppWrapper />, document.getElementById("fusion-app"));
