//https://firebase.google.com/docs/firestore/quickstart

const Firestore  = require('@google-cloud/firestore')

const db = new Firestore({
  keyFilename: `${__dirname}/serviceAccountKey.json`,
})


const newUser = (userId) => {
  db.collection('users').doc(String(userId)).set({
    id: userId,
    lastSeen: 0,
    active: true
  })
}

const addUserName = (userId, userFirstName) => {
  db.collection('users').doc(String(userId)).update({
    userFirstName: userFirstName
  })
}

const getUser = async (userId) => {
  return await db.collection('users').doc(String(userId)).get()
    .then(x => x.data())
}

const setSeen = (userId, tipId) => {
  db.collection('users').doc(String(userId)).update({
    lastSeen: tipId,
  })
}

const setActive = (userId, active) => {
  db.collection('users').doc(String(userId)).update({
    active
  })
}

const getTipById = async (tipId) => {
  return await db.collection('tips').doc(String(tipId)).get()
      .then(x => x.data())
}

const getNextTipForUser = async(userId) => {
  const {lastSeen} = await getUser(userId)
  const nextTip = await getTipById(lastSeen+1)
  setSeen(userId, lastSeen+1)
  return nextTip
}

const getCurrentTipForUser = async (userId) => {
  const {lastSeen} = await getUser(userId)
  return await getTipById(lastSeen)
}

const uploadTip = ({id, shortTitle, longTitle, description}) => {
  db.collection('tips').doc(String(id)).set({
    shortTitle,
    longTitle,
    description
  })
}

const getAllUsers = async() => {
  const users = []
  await db.collection('users').get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        users.push(doc.id)
      })
    })
  
  return users
}


module.exports = {
  newUser,
  getUser,
  setSeen,
  getTipById,
  getNextTipForUser,
  getCurrentTipForUser,
  setActive,
  uploadTip,
  getAllUsers,
  addUserName
}
