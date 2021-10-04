define(["qlik", "jquery", "text!./style.css"], function (qlik, $, cssContent) {
    "use strict";
    $("<style>").html(cssContent).appendTo("head");
    let app = qlik.currApp(this);
    let about = {
        type: "items",
        label: "About",
        items: {
            about: {
                component: {
                    template: '<p style="font-size:14px; color: #7f7f7f; text-align:left; padding-top: 10px;"><i>Created by: Ryan Arpe</i>',
                },
            },
        },
    };

    return {
        support: {
            snapshot: false,
            export: false,
            exportData: false,
        },
        definition: {
            type: "items",
            component: "accordion",
            items: {
                settings: {
                    uses: "settings",
                    items: {
                        about: about,
                    },
                },
            },
        },
        paint: function ($element) {
            let tid = $element.parent().parent().parent().parent().parent().parent().parent().parent().attr("tid");

            /**
             * Icon for open the modal
             */
            let initalhtml = `<div class="bmIcon"><span id="bmId${tid}" class="lui-icon lui-icon--bookmark" aria-hidden="true"></span></div>`;
            $element.html(initalhtml);

            // let bmButton = document.getElementById(`bmId${tid}`);
            // let hideObjects = document.querySelectorAll(".qv-object");

            let startSelect = null;
            /**
             * Adding the head html  - needed when creating Modal and when creating new Bookmark
             */
            let htmlHead = `<div id="qv-bookmark-manager">
                    <div id="header" class="panel-heading">
                        <span class="header">Bookmarks</span>
                        <div class="searchInput">
                            <input class="form-control lui-input" id="search" type="text" placeholder="Search for a Bookmark" />
                            <span id="cancel" title="Cancel Search" class="lui-icon lui-icon--remove"></span>
                        </div>
                    </div>
                    <table class="bookmarks">
                        <thead>
                            <tr>
                                <th class="headerName">Name</th>
                                <th class="iconContainer">
                                    Description
                                    <button id="create_button" title="Add new Bookmark" class="lui-button">
                                        <span class="lui-button__icon lui-icon lui-icon--plus"></span>
                                    </button>
                                </th>
                            </tr>
                        </thead>
                    </table>
                </div>`;

            const bookmarkModal = () => {
                let bmButton = document.getElementById(`bmId${tid}`);
                let hideObjects = document.querySelectorAll(".qv-object");

                bmButton.addEventListener("click", function a(event) {
                    event.preventDefault();
                    if (event.target !== event.currentTarget && event.target.id === "close_button") {
                        /**
                         * remove dialog from html only when close button is selected
                         * */

                        $element.find(`#bm_dialog`).remove();

                        for (var index = 0, length = hideObjects.length; index < length; index++) {
                            hideObjects[index].style = "";
                        }
                        return;
                    } else if (event.target !== event.currentTarget && event.target.id !== "close_button") return;

                    /**
                     *  Add the modal to the html
                     */
                    $element.find(`#bmId${tid}`).append(`<div id="bm_dialog" class="lui-dialog_containers" style="display: flex;">
                        <div class="lui-modal-backgrounds"></div>
                        <div class="lui-dialog">
                        <div class="lui-dialog__header"></div>
                        <div id="dialog_body" class="lui-dialog__body">
                        <div id="qv-spinner" class="spinner-overlay">
                        <div class="spinner-container"></div>
                        </div>
                        </div>
                        <div class="lui-dialog__footer">
                        <button title="Close" id="close_button" type="reset" class="lui-button  lui-dialog__button  close-button" style="display: flex;float: right;">
                        Close
                        </button>
                        </div>
                        </div>
                        </div>`);
                    for (var index = 0, length = hideObjects.length; index < length; index++) {
                        hideObjects[index].style.zIndex = "auto";
                    }
                    console.log("Getbook called");
                    getBookmark();
                });
            };

            bookmarkModal();

            /**
             * This calls the Qlik engine to provide a list of the Bookmarks
             * @returns {Promise} Function createListBookmark
             */
            const getListBookmark = async () => {
                let data = [];
                return await app
                    .getList("BookmarkList", (items) => {
                        data.push(items);
                    })
                    .then(() => {
                        createListBookmark(data);
                    });
            };

            const createListBookmark = (data) => {
                let html = `<table id="table" class="bookmarks">
                        <tbody id="tbody">
                        <tr id="no_match">
                        <td colspan="2" style="user-select: none;">No match</td>
                        </tr>`;

                data[0]?.qBookmarkList.qItems.forEach((row) => {
                    html += `<tr class="bmtr">
                            <td id=td_${row.qInfo.qId} class="bmarkRow">${row.qData.title}
                            <span class="notick mylui-tick lui-icon lui-icon--tick"></span>
                            </td>`;
                    html += `<td>${row.qData.description}</td></tr>`;
                });
                html += `</tbody></table></div>`;
                $element.find("#dialog_body").append(html);

                /**
                 * Function added
                 */
                getSelectionTick();
                searchBookmark();
                createNewBookmark();
            };

            /**
             * Get a list of Bookmarks and add to Modal
             */
            const getBookmark = () => {
                $element.find(".lui-dialog__header").append(htmlHead);
                getListBookmark();
                /**
                 * Remove spinnner once all object have been rendered
                 * */
                setTimeout(() => {
                    document.getElementById("qv-spinner").remove();
                }, 500);
            };

            /**
             * Create the tick when selected
             */
            const getSelectionTick = () => {
                let t = document.getElementById("table");
                let trs = t.getElementsByTagName("tr");
                let trstick = t.querySelectorAll(".lui-icon.lui-icon--tick");
                let tds = null;
                let lastSelect = 0;

                /**
                 * Open the modal needs to remember the last selection
                 */
                if (startSelect !== null) {
                    trstick[startSelect].classList.remove("notick");
                }

                for (let i = 1; i < trs.length; i++) {
                    tds = trs[i].getElementsByTagName("td");
                    tds[0].onclick = function () {
                        /**
                         * Remove the start selection
                         */
                        if (startSelect !== null) {
                            trstick[startSelect].classList.add("notick");
                        }
                        /**
                         * Remove the last selection
                         */
                        trstick[lastSelect].classList.add("notick");
                        trstick[i - 1].classList.remove("notick");

                        let bmark = this.id.split("_").pop();

                        lastSelect = startSelect = i - 1;
                        /**
                         * Apply Bookmark
                         */
                        app.bookmark.apply(bmark);
                    };
                }
            };

            /**
             * Create a new Bookmark with add and Cancel button
             */
            const createNewBookmark = () => {
                let create = document.getElementById("create_button");
                let header = document.getElementById("header");
                if (create) {
                    create.addEventListener("click", () => {
                        create.disabled = true;
                        let html = `<div id="create_container" class="addContainer">
                        <input class="form-control lui-input" id="bm_name" type="text" placeholder="Bookmark Name" />
                        <input class="form-control lui-input" id="bm_desc" type="text" placeholder="Bookmark Description" />
                        <div style="padding-left: 0.5rem; display: flex; gap: 0.5rem">
                        <button id="bm_add" title="Create Bookmark" class="lui-button lui-button--success">
                        Add
                        </button>
                        <button id="bm_cancel" title="Cancel create Bookmark" class="lui-button">
                        Cancel
                        </button>
                        </div>
                        </div>`;

                        header.insertAdjacentHTML("afterend", html);
                        addBookmark(create);
                        cancelBookmark(create);
                    });
                }
            };

            /**
             * Add the Bookmark
             * */
            const addBookmark = (create) => {
                let addbm = document.getElementById("bm_add");

                if (addbm) {
                    addbm.addEventListener("click", () => {
                        let name = document.getElementById("bm_name").value;
                        let description = document.getElementById("bm_desc").value;
                        if (name) {
                            /**
                             * Add header back
                             */
                            $element.find(".lui-dialog__header").append(htmlHead);
                            /**
                             * Add spinner
                             * */
                            let spinner = `<div id="qv-spinner" class="spinner-overlay">
                            <div class="spinner-container"></div>
                            </div>`;
                            $element.find(".lui-dialog__body").append(spinner);

                            $element.find("#create_container").remove();
                            $element.find(`#qv-bookmark-manager`).remove();
                            $element.find(`#table`).remove();
                            /**
                             * Create the Bookmark list and then recall getListBookmark function
                             */
                            app.bookmark.create(name, description).then(() => {
                                getListBookmark();
                            });

                            /**
                             * Remove spinner once all object have been rendered
                             * */
                            setTimeout(() => {
                                document.getElementById("qv-spinner").remove();
                            }, 500);
                            create.disabled = false;
                        }
                    });
                }
            };

            /**
             * Cancel create the Bookmark
             * */
            const cancelBookmark = (create) => {
                let cancelbm = document.getElementById("bm_cancel");
                if (cancelbm) {
                    cancelbm.addEventListener("click", () => {
                        $element.find("#create_container").remove();
                        create.disabled = false;
                    });
                }
            };

            /**
             * Create search for Bookmarks
             */
            const searchBookmark = () => {
                let search = document.getElementById("search");
                if (search) {
                    search.addEventListener("keyup", (event) => {
                        let value = event.target.value.toLowerCase();
                        let table = document.getElementById("table");
                        let tr = table.getElementsByTagName("tr");
                        let noMatch = document.getElementById("no_match");
                        let td = null;
                        let searchRow = [];

                        for (let i = 1; i < tr.length; i++) {
                            td = tr[i].getElementsByTagName("td")[0];

                            let txtValue = (td.textContent || td.innerText).trim();
                            if (txtValue.toLowerCase().indexOf(value) > -1) {
                                searchRow.push(txtValue);
                                tr[i].style.display = "";
                            } else {
                                tr[i].style.display = "none";
                            }

                            document.getElementById("cancel").addEventListener("click", () => {
                                tr[i].style.display = "";
                                search.value = "";
                                noMatch.style.display = "none";
                            });
                        }
                        /**
                         * NO match then add No match code
                         */
                        if (searchRow.length === 0) {
                            noMatch.style.display = "contents";
                        } else {
                            noMatch.style.display = "none";
                        }
                    });
                }
            };
            return qlik.Promise.resolve();
        },
    };
});
