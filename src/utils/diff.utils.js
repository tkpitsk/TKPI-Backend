export const getChanges = (oldData, newData) => {

  const changes = {};

  for (const key in newData) {

    if (oldData[key] !== newData[key]) {

      changes[key] = {
        before: oldData[key],
        after: newData[key]
      };

    }

  }

  return changes;

};