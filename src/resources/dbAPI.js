const low      = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('./src/resources/db.json')
const db = low(adapter)

const newUser = (userId) => {
  db.get('users')
  .push({
    id: userId,
    seen: [],
    active: true
  })
  .write()
}

const getUser = (userId) => {
  return db.get('users')
  .find({id: userId})
  .value()
}

const setSeen = (userId, tipId) => {
  db.get('users')
  .find({id: userId})
  .get('seen')
  .push(tipId)
  .write()
}

const setActive = (userId, active) => {
  db.get('users')
    .find({id: userId})
    .set('active', active)
    .write()
}

const getTipById = (tipId) => {
  return db.get('tips')
  .find({id: tipId})
  .value()
}

const getNextTipForUser = (userId) => {
  const seen = 
  db.get('users')
  .find({id: userId})
  .get('seen')
  .value()
  if(seen.length == 0) {
    setSeen(userId, 1)    
    return getTipById(1);
  }
  const lastSeen = seen[seen.length - 1]
  setSeen(userId, lastSeen+1)
  return getTipById(lastSeen+1)
}

const getCurrentTipForUser = (userId) => {
  const seen = 
  db.get('users')
  .find({id: userId})
  .get('seen')
  .value()
  if(seen.length == 0) {
    // setSeen(userId, 1)    
    // should only be called when there was already a tip seen
    return getTipById(1);
  }
  const lastSeen = seen[seen.length - 1]
  return getTipById(lastSeen)
}
/* Test */
//newUser('Zoltan')
//console.log(getTipById(1))
//setSeen('Zoltan', 1)
//setSeen('Zoltan', 2)
//console.log(getNextTipForUser('Zoltan'))

module.exports = {
  newUser,
  getUser,
  setSeen,
  getTipById,
  getNextTipForUser,
  getCurrentTipForUser,
  setActive,
}