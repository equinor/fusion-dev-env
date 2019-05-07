import Guid from "guid";

const REGISTER_FUSION_APP = "REGISTER_FUSION_APP";

const registeredApps = [];

export const registerApp = (appKey, manifest) => {
  const manifestKey = Guid.raw();
  window[manifestKey] = manifest;
  window.postMessage(
    {
      type: REGISTER_FUSION_APP,
      appKey,
      manifestKey
    },
    window.location.href
  );
};

const listeners = [];

export const registerAppListener = listener => {
  listeners.push(listener);
  registeredApps.forEach(app => listener(app.appKey, app.manifest));
  return () => listener.splice(listener.indexOf(listener), 1);
};

const notifyListeners = (appKey, manifest) => {
  listeners.forEach(listener => listener(appKey, manifest));
};

window.addEventListener("message", e => {
  if (
    e.data &&
    e.data.type === REGISTER_FUSION_APP &&
    e.origin === window.location.origin
  ) {
    const { appKey, manifestKey } = e.data;
    const manifest = window[manifestKey];

    delete window[manifestKey];

    notifyListeners(appKey, manifest);

    registeredApps.push({
      appKey,
      manifest
    });
  }
});
