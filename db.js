// ===================== IndexedDB layer =====================
const DB_NAME = 'SteelGalvanizingDB';
const DB_VERSION = 1;
let dbInstance = null;

function openDB(){
  return new Promise((resolve, reject) => {
    if(dbInstance){ resolve(dbInstance); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if(!db.objectStoreNames.contains('expeditions')){
        const store = db.createObjectStore('expeditions', {keyPath:'id', autoIncrement:true});
        store.createIndex('numero', 'numero', {unique:false});
        store.createIndex('date', 'date', {unique:false});
        store.createIndex('status', 'status', {unique:false});
      }
      if(!db.objectStoreNames.contains('erreurs')){
        const store2 = db.createObjectStore('erreurs', {keyPath:'id', autoIncrement:true});
        store2.createIndex('expeditionId', 'expeditionId', {unique:false});
        store2.createIndex('repere', 'repere', {unique:false});
        store2.createIndex('type', 'type', {unique:false});
      }
    };
    req.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror = (e) => reject(e.target.error);
  });
}

function txStore(storeName, mode){
  return openDB().then(db => db.transaction(storeName, mode).objectStore(storeName));
}

const DB = {
  async addExpedition(exp){
    const store = await txStore('expeditions', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.add(exp);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async updateExpedition(exp){
    const store = await txStore('expeditions', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(exp);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async deleteExpedition(id){
    const store = await txStore('expeditions', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async getExpedition(id){
    const store = await txStore('expeditions', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async getAllExpeditions(){
    const store = await txStore('expeditions', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result.sort((a,b)=> (b.date||'').localeCompare(a.date||'') || b.id - a.id));
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async addErreur(err){
    const store = await txStore('erreurs', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.add(err);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async updateErreur(err){
    const store = await txStore('erreurs', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(err);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async getAllErreurs(){
    const store = await txStore('erreurs', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result.sort((a,b)=> (b.date||'').localeCompare(a.date||'') || b.id - a.id));
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async clearErreursForExpedition(expId){
    const all = await this.getAllErreurs();
    const store = await txStore('erreurs', 'readwrite');
    all.filter(e => e.expeditionId === expId).forEach(e => store.delete(e.id));
  }
};
