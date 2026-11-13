// Static asset host for OBJECT CHAOS. The whole app is prebuilt into ./output-static
// (see README → Deployment); this Worker only serves those files.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
