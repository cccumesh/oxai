/** Order multi-side / stop helpers (pure entry shape). */

export function emptyStop(stopNo = 1) {
  return {
    stopNo: Number(stopNo) || 1,
    jarsGiven: 0,
    emptyCollected: 0,
    thermosGiven: 0,
    thermosCollected: 0,
    dropPlace: "",
  };
}

export function syncEntryFromStops(e) {
  if (!e) return e;
  if (!Array.isArray(e.stops) || !e.stops.length) {
    e.stops = [emptyStop(1)];
  }
  e.stops.sort((a, b) => (a.stopNo || 0) - (b.stopNo || 0));
  e.jarsGiven = e.stops.reduce((s, x) => s + (Number(x.jarsGiven) || 0), 0);
  e.emptyCollected = e.stops.reduce((s, x) => s + (Number(x.emptyCollected) || 0), 0);
  e.thermosGiven = e.stops.reduce((s, x) => s + (Number(x.thermosGiven) || 0), 0);
  e.thermosCollected = e.stops.reduce((s, x) => s + (Number(x.thermosCollected) || 0), 0);
  e.dropPlace = e.stops.map((x) => String(x.dropPlace || "").trim()).filter(Boolean).join(" · ");
  return e;
}

export function ensureStops(e) {
  if (!e) return null;
  if (!Array.isArray(e.stops) || !e.stops.length) {
    e.stops = [{
      stopNo: 1,
      jarsGiven: Number(e.jarsGiven) || 0,
      emptyCollected: Number(e.emptyCollected) || 0,
      thermosGiven: Number(e.thermosGiven) || 0,
      thermosCollected: Number(e.thermosCollected) || 0,
      dropPlace: e.dropPlace || "",
    }];
  }
  return syncEntryFromStops(e);
}

export function getStop(e, stopNo) {
  ensureStops(e);
  const n = Number(stopNo) || 1;
  return e.stops.find((s) => Number(s.stopNo) === n) || e.stops[0];
}

export function emptyEntry(customer) {
  const e = {
    customerId: customer.id,
    driverId: customer.device_id,
    stops: [emptyStop(1)],
    status: "pending",
    completedAt: null,
  };
  return syncEntryFromStops(e);
}

export function entryFromRows(customer, rows) {
  const list = (rows || []).slice().sort((a, b) => (a.stop_no || 1) - (b.stop_no || 1));
  if (!list.length) return emptyEntry(customer);
  const stops = list.map((r) => ({
    stopNo: r.stop_no || 1,
    jarsGiven: r.jars_given || 0,
    emptyCollected: r.empty_collected || 0,
    thermosGiven: r.thermos_given || 0,
    thermosCollected: r.thermos_collected || 0,
    dropPlace: r.drop_place || "",
  }));
  const top = list.every((r) => r.status === "complete") ? list[list.length - 1] : list.find((r) => r.status !== "complete") || list[0];
  const e = {
    customerId: customer.id,
    driverId: customer.device_id,
    stops,
    status: list.every((r) => r.status === "complete") ? "complete" : "pending",
    completedAt: top.completed_at ? new Date(top.completed_at).getTime() : null,
  };
  return syncEntryFromStops(e);
}

export function entryStamp(e) {
  ensureStops(e);
  return JSON.stringify({
    status: e.status,
    completedAt: e.completedAt,
    stops: e.stops,
  });
}
