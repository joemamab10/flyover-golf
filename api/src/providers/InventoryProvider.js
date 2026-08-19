export class InventoryProvider {
  constructor(id, label) {
    this.id = id;
    this.label = label;
  }

  async search(_course, _date, _players) {
    throw new Error("search() must be implemented by provider adapter");
  }

  normalize(_raw, _course) {
    throw new Error("normalize() must be implemented by provider adapter");
  }
}
