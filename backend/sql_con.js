

try {
  

  const [results, fields] = con.execute();
  console.log(results, fields);
} catch (err) {
  console.log(err);
}
