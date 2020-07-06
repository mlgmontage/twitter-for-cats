const form = document.querySelector("form");
const loadingElement = document.querySelector(".loading");
const mewsElement = document.querySelector(".mews");
const loadMoreButton = document.querySelector("#loadMoreButton");
loadingElement.style.display = "none";

const API_URL =
  window.location.hostname === "127.0.0.1"
    ? `http://localhost:3000/v2`
    : `http://productionserver.com`;

let skip = 0;
let limit = 5;
loadingElement.style.display = "";

loadMoreButton.addEventListener("click", loadMore);

listAllMews();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const name = formData.get("name");
  const content = formData.get("content");

  const mew = {
    name,
    content,
  };

  form.style.display = "none";
  loadingElement.style.display = "";

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(mew),
    headers: {
      "content-type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((createdMew) => {
      form.reset();
      console.log(createdMew);
      setTimeout(() => {
        form.style.display = "";
      }, 3000);
      loadingElement.style.display = "none";
      listAllMews();
    });
});

function loadMore(event) {
  skip += limit;
  listAllMews(false);
}

function listAllMews(reset = true) {
  fetch(`${API_URL}/mews?skip=${skip}&limit=${limit}`)
    .then((res) => res.json())
    .then((result) => {
      if (reset) {
        mewsElement.innerHTML = "";
        skip = 0;
      }

      result.mews.forEach((mew) => {
        const div = document.createElement("div");

        const header = document.createElement("h3");
        header.textContent = mew.name;

        const content = document.createElement("p");
        content.textContent = mew.content;

        const date = document.createElement("small");
        date.textContent = mew.created;

        div.appendChild(header);
        div.appendChild(content);
        div.appendChild(date);

        mewsElement.appendChild(div);
      });
      loadingElement.style.display = "none";
      if (!result.pagination.has_more) {
        loadMoreButton.style.visibility = "hidden";
      } else {
        loadMoreButton.style.visibility = "visible";
      }
    });
}
