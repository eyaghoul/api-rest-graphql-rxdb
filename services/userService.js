const dbPromise = require('../db');

// GET ALL USERS
async function getUsers() {
  const { users } = await dbPromise;

  const docs = await users.find().exec();
  return docs.map(d => d.toJSON());
}

// GET USER BY ID
async function getUser(id) {
  const { users } = await dbPromise;

  const doc = await users.findOne(id).exec();
  return doc ? doc.toJSON() : null;
}

// CREATE USER
async function createUser({ name, email, password }, createId) {
  const { users } = await dbPromise;

  const inserted = await users.insert({
    id: createId(),
    name,
    email,
    password
  });

  return inserted.toJSON();
}

// UPDATE USER
async function updateUser({ id, name, email, password }) {
  const { users } = await dbPromise;

  const doc = await users.findOne(id).exec();
  if (!doc) return null;

  const updated = await doc.incrementalPatch({
    name,
    email,
    password
  });

  return updated.toJSON();
}

// DELETE USER + CLEAN DEVICES
async function deleteUser(id) {
  const { users, devices } = await dbPromise;

  const user = await users.findOne(id).exec();
  if (!user) return false;

  const userDevices = await devices.find({
    selector: { userId: id }
  }).exec();

  for (const d of userDevices) {
    await d.remove();
  }

  await user.remove();
  return true;
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};