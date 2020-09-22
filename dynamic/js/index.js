const submitBtn = document.getElementById("submit-btn");
const form = document.querySelector('form');
// const strategiesContainer = document.querySelector('.strategies');

const url = 'http://127.0.0.1:5000/'; //'https://finance-pwa.herokuapp.com/';
// const indexedDBVer = 2;

function init() {
    initializeServiceWorker();
    initializeDB();
    checkIndexedDB();
}

init();

function checkIndexedDB() {
    if(navigator.onLine) {
        var strategiesDB = window.indexedDB.open('strategiesDB');
        strategiesDB.onsuccess = function(event) {
            this.result.transaction("strategiesObjStore").objectStore("strategiesObjStore").getAll().onsuccess = function(event) {
                event.target.result.forEach(function (item, index) {
                    console.log(JSON.stringify(item), index);
                    var itemStr = JSON.stringify(item);
                    client.callFunction("updateStrategyConfiguration", [itemStr]).then(result => {
                        console.log('update result:', JSON.stringify(result))
                        localStorage.setItem("strategyType", result.strategyType);
                        var strategyIDRes = result._id.toString();
                        console.log('strategyID', strategyID)
                        var strategyID = localStorage.getItem("strategyID");
                        if (strategyID == strategyIDRes)
                        {
                            console.log('IDs match')
                        }
                        else
                        {
                            console.log('IDs mismatch', strategyIDRes, strategyID)
                        }
                        localStorage.setItem("strategyID", strategyIDRes);

                     });
                  })
                
                  strategiesDB.result.transaction("strategiesObjStore", "readwrite")
                  .objectStore("strategiesObjStore")
                  .clear();

              

                //   .then(function(rez) {
                //         return rez.text();
                //     }).then(function(response) {
                //         strategiesDB.result.transaction("strategiesObjStore", "readwrite")
                //         .objectStore("strategiesObjStore")
                //         .clear();
                //         console.log(response);
                //     }).catch(function(err) {
                //         console.log('err ', err);
                //     })


                }
            }
        }
    };
                
                // window.fetch(url, { 
                //         method: 'POST',
                //         body: JSON.stringify(event.target.result),
                //         headers:{
                //           'Content-Type': 'application/json'
                //         }
                //     })
                
                

//             };
//         };
//     }
// }

function initializeDB() {
    var strategiesDB = window.indexedDB.open('strategiesDB');

    strategiesDB.onupgradeneeded = function(event) {
        var db = event.target.result;

        var strategiesObjStore = db.createObjectStore("strategiesObjStore", { autoIncrement: true });
        strategiesObjStore.createIndex("_id", "_id", { unique: true });
        strategiesObjStore.createIndex("userID", "userID", { unique: false });
        strategiesObjStore.createIndex("strategyName", "strategyName", { unique: true });
        strategiesObjStore.createIndex("strategyDescription", "strategyDescription", { unique: false });
        //strategiesObjStore.createIndex("strategyInfo", "strategyInfo", { unique: true });
        strategiesObjStore.createIndex("dateAdded", "dateAdded", { unique: true });
    }
}

function initializeServiceWorker() {
    if(navigator.serviceWorker) {
        navigator.serviceWorker.register('/sw-indexedDB.js')
        .then(function() {
            return navigator.serviceWorker.ready
        })
        .then(function(registration) {
            console.log('IndexedDB service worker registered', registration);
            
            if (submitBtn !== null) {
                submitBtn.addEventListener("click", function(){
                    var tmpObjJson = JSON.parse(localStorage.getItem("tmpObj"))
                    console.log('success in passing:', tmpObjJson);
                    saveFormData(tmpObjJson).then(function() {
                        if(registration.sync) {
                            registration.sync.register('example-sync')
                            .catch(function(err) {
                                return err;
                            })
                        } else {
                            // sync isn't there so fallback
                            checkInternet();
                        }
                    });    
                  });
            }

            if (strategiesContainer !== null) {
                strategiesContainer.addEventListener('click', evt => {
                console.log(evt);
                
                    // delete strategy in server / DOM / IndexedDB
                    if(evt.target.tagName === 'I'){   
                        const id = evt.target.getAttribute('data-id');                
                        // mongo delete then delete from dom
                        console.log({ '_id': String(id) })
                        removeFormData(id).then(function() {
                            if(registration.sync) {
                                registration.sync.register('example-sync') // sane string as add??
                                .catch(function(err) {
                                    return err;
                                })
                            } else {
                                // sync isn't there so fallback
                                checkInternet();
                            }
                        });
                    };
                    // go to strategy
                    
                    if(evt.target.tagName != 'I'){
                        // https://javascript.info/event-delegation
                        let idObj = evt.target.closest('.strategy');
                        if (!idObj) return;
                        if (!strategiesContainer.contains(idObj)) return;
                        const id = idObj.getAttribute('data-id'); 

                        // send strategy update request
                        // openStrategy(String(id));
                        client.callFunction("runOneStrategyByObjID", [id]).then(result => {
                            console.log('run result',result)
                            
                        });
                        // open strategy results
                        openStrategy(String(id));
                            
                    };
                })
            }

              

            // // add new strategy to indexeddb then add to server if available 
            // form.addEventListener('submit', event => {
            //     event.preventDefault();
            //     // add to IndexedDB and DOM
            //     saveFormData().then(function() {
            //         if(registration.sync) {
            //             registration.sync.register('example-sync')
            //             .catch(function(err) {
            //                 return err;
            //             })
            //         } else {
            //             // sync isn't there so fallback
            //             checkInternet();
            //         }
            //     });
            // })



              
            
            


            // });

            // 

        })
    } else {
        document.querySelector('form').addEventListener('submit', (event) => {
        // document.getElementById('submitForm').addEventListener('click', (event) => {
            event.preventDefault();
            saveFormData().then(function() {
                checkInternet();
            });
        })
    }
}



function saveFormData(newFormData) {
    return new Promise(function(resolve, reject) {

        // var strategyNameKey = Object.keys(newFormData)[0];
        var newDataKey = Object.keys(newFormData)[1];
        var newDataValues = newFormData[newDataKey];
        //var strategyName = newFormData['strategyName']
        var strategyID = newFormData['strategyID']
        var tmpObj = {
            userID: client.auth.currentUser.id, 
            'strategyID': strategyID,
//            'strategyName': strategyName,
            [newDataKey] : newDataValues,
            // strategyName: form.StrategyName.value,
            // strategyDescription: form.strategyDescription.value,
            // userID: document.getElementById('recipe-StrategyName').value,
            // strategyName: document.getElementById('strategyName').value,
            // strategyInfo: document.getElementById('strategyInfo').value,
            status: 'added',
            dateAdded: new Date()
        };
        
        // addToIndexedDBandDom('strategiesDB', 'strategiesObjStore', tmpObj, 'form');
        var myDB = window.indexedDB.open('strategiesDB');
        
        myDB.onsuccess = function(event) {
            var objStore = this.result.transaction('strategiesObjStore', 'readwrite').objectStore('strategiesObjStore');
            var resp = objStore.add(tmpObj);
            // Add to DOM
            resp.onsuccess = function(e) { 
                // location.reload();}
                console.log("success: data sent to server");
                if (localStorage.getItem("redirectTo") !== null)
                {   
                    var newLocation = localStorage.getItem("redirectTo") 
                    window.location.href = newLocation;
                }
            resolve();
        }
        // form.StrategyName.value = '';
        // form.ingredients.value = '';

        myDB.onerror = function(err) {
            reject(err);
        }




        }    
    })
}

function removeFormData(id) {
    return new Promise(function(resolve, reject) {
        removeFromIndexedDBandDom('strategiesDB', 'strategiesObjStore', id);
    })
}

function removeFromIndexedDBandDom(dbName, objStoreName, idToRemove) {
    return new Promise(function(resolve, reject){
        var myDB = window.indexedDB.open(dbName);
        // var removeQuery = JSON.stringify({ '_id': idToRemove });
        deleteDataInStitch(idToRemove)
        .then((data) => {
        console.log('data removed:', data); // JSON data parsed by `response.json()` call

        myDB.onsuccess = function(event) {
            var objStore = this.result.transaction(objStoreName, 'readwrite').objectStore(objStoreName);
            var resp = objStore.delete(idToRemove);
            // Remove from DOM
            resp.onsuccess = function(e) { 
              removeStrategy(String(idToRemove));  
          };
            resolve();
          }
      
          myDB.onerror = function(err) {
              reject(err);
          }
  
    });


    })
}


async function deleteDataInStitch(objID = {}) {
    console.log('ID to remove',objID)
// alert("to do")
    // const response = await fetch(url, {
    // method: 'DELETE', 
    // headers: {
    //     'Content-Type': 'application/json'
    // },
    // body: JSON.stringify(data) 
    // });
    // return await response.json(); 
    client.callFunction("removeOneStrategyByObjID", [objID]).then(removeStratConfigResult => {
        console.log('remove result',removeStratConfigResult)
        var strategyID = objID;
        client.callFunction("removeManyStrategyResultsByStrategyID", [strategyID]).then(removeStratResults => {
            console.log('remove result',removeStratResults)
        });     
    });
}

async function deleteDataInServer(data = {}) {
    const response = await fetch(url, {
    method: 'DELETE', 
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data) 
    });
    return await response.json(); 
    // addToStrategiesDB(myObj._id, myObj.userID, myObj.strategyName);
}

function fetchIndexedDBData() {
    return new Promise(function(resolve, reject) {
        var myDB = window.indexedDB.open('strategiesDB');

        myDB.onsuccess = function(event) {
            this.result.transaction("strategiesObjStore").objectStore("strategiesObjStore").getAll().onsuccess = function(event) {
                resolve(event.target.result);
            };
        };

        myDB.onerror = function(err) {
            reject(err);
        }
    })
}

function sendDataToStitch() {
    fetchIndexedDBData().then(function(response) {
        var postObj = {
            method: 'POST',
            body: JSON.stringify(response),
            headers:{
              'Content-Type': 'application/json'
            }
        };
    
        // send request
        return client.callFunction("updateStrategyConfiguration", [JSON.stringify(response)]) 
    })
    .then(clearData)
    .catch(function(err) {
        console.log(err);
    });
}


// function sendDataToServer() {
//     fetchIndexedDBData().then(function(response) {
//         var postObj = {
//             method: 'POST',
//             body: JSON.stringify(response),
//             headers:{
//               'Content-Type': 'application/json'
//             }
//         };
    
//         // send request
//         return window.fetch(url, postObj) 
//     })
//     .then(clearData)
//     .catch(function(err) {
//         console.log(err);
//     });
// }

function clearData() {
    return new Promise(function(resolve, reject) {
        var db = window.indexedDB.open('strategiesDB');
        db.onsuccess = function(event) {
            db.transaction("strategiesDB", "readwrite")
            .objectStore("strategiesObjStore")
            .clear();

            resolve();
        }

        db.onerror = function(err) {
            reject(err);
        }
    })
}

function checkInternet() {
    event.preventDefault();
    if(navigator.onLine) {
        sendDataToStitch();
    } else {
        alert("You are offline! When your internet returns, we'll finish up your request.");
    }
}

window.addEventListener('online', function() {
    if(!navigator.serviceWorker && !window.SyncManager) {
        fetchIndexedDBData().then(function(response) {
            if(response.length > 0) {
                return sendDataToStitch();
            }
        });
    }
});

window.addEventListener('offline', function() {
    alert('You have lost internet access!');
});

//////////////////////////////// My Functions /////////////////////////////////////////////////////


  
