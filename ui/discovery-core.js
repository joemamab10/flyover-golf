var FlyoverDiscovery = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // shared/discovery.js
  var discovery_exports = {};
  __export(discovery_exports, {
    discover: () => discover,
    localDate: () => localDate,
    validDate: () => validDate
  });
  function localDate(now = /* @__PURE__ */ new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  function validDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  }
  function discover(catalog, preferences = {}, rounds = []) {
    const city = preferences.city || "all";
    return catalog.filter((course) => course.verifiedOn && (city === "all" || course.city === city)).map((course) => {
      const reviews = rounds.filter((round) => (round.courseId === course.id || course.aliases?.includes(round.courseId)) && round.status === "completed" && round.feedback).sort((a, b) => b.date.localeCompare(a.date) || (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));
      const latest = reviews[0];
      let priority = 0, reason = "Explore a course in your selected area.";
      if (latest) {
        priority = latest.feedback.playAgain === "yes" ? 1 : latest.feedback.playAgain === "no" ? -1 : 0;
        reason = priority === 1 ? `You said you\u2019d return after your ${latest.date} round.` : priority === -1 ? `You preferred another course after your ${latest.date} round.` : `You were unsure about returning after your ${latest.date} round.`;
      }
      return { ...course, priority, reason, reviewedOn: latest?.date ?? null };
    }).sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
  }
  return __toCommonJS(discovery_exports);
})();
