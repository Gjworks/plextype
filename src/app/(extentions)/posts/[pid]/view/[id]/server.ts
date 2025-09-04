export const getData = async () => {
  const data = {
    documentId : 7
  };

  const response = await fetch("/api/posts/View", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const result = await response.json();
  return result;

}

