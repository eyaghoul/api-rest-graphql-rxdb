const dbPromise = require('./db');
function toJson(doc) {
return doc ? doc.toJSON() : null;
}
async function findByEmail(usersCollection, email) {
return usersCollection.findOne({
selector: { email }
}).exec();
}
async function ensureUniqueEmail(usersCollection, email, excludedId = null) {
  const existing = await findByEmail(usersCollection, email);
  if (existing && existing.id !== excludedId) {
    throw new Error('Adresse e-mail déjà utilisée');
  }
}

async function getDevicesByUser(devices, userId) {
  const docs = await devices.find({
    selector: { userId }
  }).exec();

  return docs.map(d => d.toJSON());
}

async function deleteDevice(devices, id) {
  const doc = await devices.findOne(id).exec();
  if (!doc) return false;

  await doc.remove();
  return true;
}

async function createDevice(devices, users, createId, data) {
  const { userId, name, type, serialNumber, status } = data;

  const userDoc = await users.findOne(userId).exec();
  if (!userDoc) {
    throw new Error('Utilisateur non trouvé');
  }

  const inserted = await devices.insert({
    id: createId(),
    userId,
    name,
    type,
    serialNumber,
    status
  });

  return inserted.toJSON();
}


module.exports = {
user: async ({ id }) => {
const { users } = await dbPromise;
const doc = await users.findOne(id).exec();
return toJson(doc);
},
users: async () => {
const { users } = await dbPromise;
const docs = await users.find().exec();
return docs.map((doc) => doc.toJSON());
},
addUser: async ({ name, email, password }) => {
const { users, persistUsers, createId } = await dbPromise;
await ensureUniqueEmail(users, email);
const inserted = await users.insert({
id: createId(),
name,
email,
password
});
await persistUsers(users);
return inserted.toJSON();
},
updateUser: async ({ id, name, email, password }) => {
const { users, persistUsers } = await dbPromise;
const doc = await users.findOne(id).exec();
if (!doc) {
return null;
}
await ensureUniqueEmail(users, email, id);
const updatedDoc = await doc.incrementalPatch({
name,
email,
password
});
await persistUsers(users);
return updatedDoc.toJSON();
},
deleteUser: async ({ id }) => {
  const { users, devices, persistUsers } = await dbPromise;

  const doc = await users.findOne(id).exec();
  if (!doc) {
    return false;
  }

  // 🔥 CASCADE DELETE (composition)
  const userDevices = await devices.find({
    selector: { userId: id }
  }).exec();
  for (const d of userDevices) {
    await d.remove();
  }
  await doc.remove();

  await persistUsers(users);

  return true;
},
devicesByUser: async ({ userId }) => {
    const { devices } = await dbPromise;
    return getDevicesByUser(devices, userId);
  },
addDevice: async (args) => {
  const { devices, users, createId } = await dbPromise;
  return createDevice(devices, users, createId, args);
},
updateDevice: async ({ id, name, type, serialNumber, status }) => {
    const { devices } = await dbPromise;

  const doc = await devices.findOne(id).exec();
  if (!doc) return null;

  const updated = await doc.incrementalPatch({
    name,
    type,
    serialNumber,
    status
  });

  return updated.toJSON();
},
deleteDevice: async ({ id }) => {
    const { devices} = await dbPromise;
    return deleteDevice(devices, id);    
}}