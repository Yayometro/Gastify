import React, { useEffect, useState } from "react";
import "@/components/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";

import { PiExcludeSquareDuotone } from "react-icons/pi";
import { HiMiniCursorArrowRipple } from "react-icons/hi2";
import currencyFormatter from "currency-formatter";
import CategoIcon from "./CategoIcon";
import UniversalCategoIcon from "./UniversalCategoIcon";
import dayjs from "dayjs";
import Tag from "./Tag";
import fetcher from "@/helpers/fetcher";
import EditTransModal from "./EditTransModal";
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";
import { Tooltip, Button, Modal, Skeleton } from "antd";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditMultipleTransModal from "./EditMultipleTransModal";
import EmptyModule from "./EmptyModule";
import runNotify from "@/helpers/gastifyNotifier";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTrans,
  removeManyTransactions,
  removeOneTransacction,
} from "@/lib/features/transacctionsSlice";

function Movements({ movements, period, mail }) {
  const [allMovements, setAllMovements] = useState([]);
  const [timePeriod, setTimePeriod] = useState(30);
  const [trastType, setTransType] = useState("all");
  const [readable, setReadable] = useState("all");
  const [removedElement, setRemovedElement] = useState(false);
  const [editModal, setEditModal] = useState([]);
  const [editMultiModal, setEditMultiModal] = useState([]);
  const [showMultipleTransEdit, setShowMultipleTransEdit] = useState(false);
  const [selectedTrans, setSelectedTrans] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [isRemoveModal, setIsRemoveModal] = useState(false);
  const [isRemoveModalMany, setIsRemoveModalMany] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [transRemovableId, setTransRemovableId] = useState("");
  const [loadingComponent, setLoadingComponent] = useState(true);
  // Loading FETCHER
  const toFetch = fetcher();
  // REDUX
  const reduxDispartcher = useDispatch();
  const reduxAllTrans = useSelector((state) => state.transacctionsReducer);
  const rdxTransactions = reduxAllTrans?.data;
  // console.log(reduxAllTrans);
  // console.log(reduxAllTrans.status);
  // console.log(rdxTransactions);
  //
  const today = new Date();
  const dayRange = new Date();
  // First loading the component
  useEffect(() => {
    if (reduxAllTrans.status == "idle") {
      // console.log(rdxTransactions);
      reduxDispartcher(fetchTrans(mail));
    }
  }, []);
  useEffect(() => {
    if (rdxTransactions.length > 0) {
      //REDUX
      if (reduxAllTrans.status == "succeeded") {
        setLoadingComponent(false);
      }
      //DATE
      dayRange.setDate(today.getDate() - timePeriod);
      //
      let total = rdxTransactions.filter((mov) => {
        const transactionDate = new Date(mov.date || mov.createdAt);
        return transactionDate >= dayRange;
      });
      total = total.sort((a, b) => {
        let dateA = new Date(a.date || a.createdAt);
        let dateB = new Date(b.date || b.createdAt);

        return dateB - dateA;
      });

      setAllMovements(total);
      setTimePeriod(period);
    }
  }, [rdxTransactions, period]);

  useEffect(() => {
    if (rdxTransactions.length > 0) {
      //REDUX
      if (reduxAllTrans.status == "succeeded") {
        setLoadingComponent(false);
      }
      //DATE
      dayRange.setDate(today.getDate() - timePeriod);
      //
      let total = rdxTransactions.filter((mov) => {
        const transactionDate = new Date(mov.date || mov.createdAt);
        return transactionDate >= dayRange;
      });
      total = total.sort((a, b) => {
        let dateA = new Date(a.date || a.createdAt);
        let dateB = new Date(b.date || b.createdAt);

        return dateB - dateA;
      });

      setAllMovements(total);
      setTimePeriod(timePeriod);
    }
  }, [timePeriod, rdxTransactions]);

  const handleDurationChange = (event) => {
    setTimePeriod(parseInt(event.target.value, 10));
  };
  const handleTransType = (event) => {
    const type = event.target.value;
    const today = new Date();
    const dayRange = new Date();
    dayRange.setDate(today.getDate() - timePeriod);
    let total = rdxTransactions.filter((mov) => {
      const transactionDate = new Date(mov.date || mov.createdAt);
      return transactionDate >= dayRange;
    });
    total = total.sort((a, b) => {
      let dateA = new Date(a.date || a.createdAt);
      let dateB = new Date(b.date || b.createdAt);

      return dateB - dateA;
    });
    if (type == "all") {
      setAllMovements(total);
    }
    if (type == "incomes") {
      const accIncomes = total.filter((bill) => bill.isIncome && !bill.isBill);
      setAllMovements(accIncomes);
    }
    if (type == "bills") {
      const accBills = total.filter((bill) => bill.isBill && !bill.isIncome);
      setAllMovements(accBills);
    }

    setTransType(event.target.value);
  };

  const handleReadable = (event) => {
    const type = event.target.value;
    const today = new Date();
    const dayRange = new Date();
    dayRange.setDate(today.getDate() - timePeriod);
    let total = rdxTransactions.filter((mov) => {
      const transactionDate = new Date(mov.date || mov.createdAt);
      return transactionDate >= dayRange;
    });
    total = total.sort((a, b) => {
      let dateA = new Date(a.date || a.createdAt);
      let dateB = new Date(b.date || b.createdAt);

      return dateB - dateA;
    });
    if (type === "all") {
      setAllMovements(total);
    }
    if (type === "true") {
      total = total.filter((tra) => tra.isReadable);
      setAllMovements(total);
    }
    if (type === "false") {
      total = total.filter((tra) => !tra.isReadable);
      setAllMovements(total);
    }
    setReadable(type);
  };

  const handleCleanFilter = () => {
    setReadable("all");
    setTransType("all");
    setTimePeriod(period || 30);
  };

  const handleTransactionRemove = async (id) => {
    try {
      //Animation and DOM
      const element = document.getElementById(`trans-${id}`);
      element.classList.add("backOutDown-5seg");
      await new Promise((resolve) => setTimeout(resolve, 251));
      element.classList.add("hidden");
      // Removed in Front End
      // const cleanedMov = allMovements.filter((mov) => mov._id !== id);
      // setAllMovements(cleanedMov);
      //Remove from, Redux
      reduxDispartcher(removeOneTransacction(id));
      // Removed in BackEnd
      const res = await toFetch.post(
        `general-data/transactions/remove-transaction/${id}`
      );
      // console.log(res);
      if (res.ok) {
        runNotify("ok", String(res.message));
        setIsRemoveModal(false);
        setConfirmLoading(false);
      } else {
        runNotify(
          "error",
          "Something went wrong removing your items, verify your request and try again 🤕"
        );
        setIsRemoveModal(false);
        setConfirmLoading(false);
      }
    } catch (e) {
      console.log(e);
      runNotify("error", String(e));
      setIsRemoveModal(false);
      setConfirmLoading(false);
      return null;
    }
  };

  const handleRemoveManyTransactions = async (transs) => {
    try {
      // console.log(transs);
      if (transs.length === 0) {
        runNotify(
          "error",
          "No items selected to removed, please select at least two"
        );
        return; // No hay transacciones para eliminar
      }
      // Animar y ocultar elementos en el DOM
      if (transs.length >= 15) {
        const element = document.getElementById(`trans-${tra}`);
        if (element) {
          element.classList.add("hidden");
        }
      } else {
        for (const tra of transs) {
          const element = document.getElementById(`trans-${tra}`);
          if (element) {
            element.classList.add("backOutDown-5seg");
            await new Promise((resolve) => setTimeout(resolve, 251));
            element.classList.add("hidden");
          }
        }
      }
      // Remove elements (Front End)
      // const remainingMovements = allMovements.filter(
      //   (mov) => !transs.includes(mov._id)
      // );
      // Remove in REDUX
      reduxDispartcher(removeManyTransactions(transs));
      // setAllMovements(remainingMovements);
      // Remove items from selector mode
      setSelectedTrans([]);
      // Eliminar los elementos del backend
      const transArray = { manyTrans: transs };
      const res = await toFetch.post(
        `general-data/transactions/remove-many`,
        transArray
      );
      //Handle message to front end
      if (res.ok) {
        runNotify("ok", String(res.message));
        setIsRemoveModalMany(false);
        setConfirmLoading(false);
      } else {
        runNotify(
          "error",
          "Something went wrong removing your items, verify your request and try again 🤕"
        );
        setIsRemoveModalMany(false);
        setConfirmLoading(false);
      }
    } catch (e) {
      runNotify("error", String(e));
      setIsRemoveModalMany(false);
      setConfirmLoading(false);
      return null;
    }
  };

  const handleTransEdit = (tra) => {
    const editTransMo = (
      <EditTransModal
        hidden={editModal}
        trans={tra}
        key={`editModal-${editModal.length + 1}-${tra._id}`}
      />
    );
    setEditModal([...editModal, editTransMo]);
  };
  const handleMultiTransEdit = (ids) => {
    console.log(ids);
    const editMultiTransMo = (
      <EditMultipleTransModal
        hidden={editMultiModal}
        trans={ids}
        key={`editMultiModal-${ids[0]._id}`}
      />
    );
    setEditMultiModal([...editMultiModal, editMultiTransMo]);
  };
  const handeTransSelection = () => {
    setIsSelectionMode(!isSelectionMode);

    // Si se activa el modo de edición, seleccionar todas las transacciones
    if (!isSelectionMode) {
    } else {
      // Si se desactiva el modo de edición, deseleccionar todas las transacciones
      allMovements.forEach((mov) => {
        const itemSele = document.getElementById(`trans-${mov._id}`);
        itemSele &&
          itemSele.classList.remove(
            "edit-animation",
            "border-[2px]",
            "border-purple-400"
          );
      });
      setSelectedTrans([]); // Limpiar el array de transacciones seleccionadas
    }
  };
  const handleSelectedItem = (id) => {
    // Obtener el elemento DOM correspondiente
    const itemSele = document.getElementById(`trans-${id}`);
    // Verificar si el ID ya está en el array
    if (selectedTrans.includes(id)) {
      // Quitar el ID del array
      setSelectedTrans(selectedTrans.filter((transId) => transId !== id));

      // Quitar la clase de animación
      itemSele &&
        itemSele.classList.remove(
          "edit-animation",
          "border-[2px]",
          "border-purple-400"
        );
    } else {
      // Agregar el ID al array
      setSelectedTrans([...selectedTrans, id]);

      // Agregar la clase de animación
      itemSele &&
        itemSele.classList.add(
          "edit-animation",
          "border-[2px]",
          "border-purple-400"
        );
    }
  };
  const handleSelectedAll = () => {
    if (selectedTrans.length === allMovements.length) {
      // Si todas las transacciones ya están seleccionadas, deseleccionarlas
      allMovements.forEach((mov) => {
        const itemSele = document.getElementById(`trans-${mov._id}`);
        itemSele &&
          itemSele.classList.remove(
            "edit-animation",
            "border-[2px]",
            "border-purple-400"
          );
      });
      setSelectedTrans([]); // Limpiar el array de transacciones seleccionadas
    } else {
      // Si no todas las transacciones están seleccionadas, seleccionarlas todas
      allMovements.forEach((mov) => {
        const itemSele = document.getElementById(`trans-${mov._id}`);
        itemSele &&
          itemSele.classList.add(
            "edit-animation",
            "border-[2px]",
            "border-purple-400"
          );
      });
      setSelectedTrans(allMovements.map((mov) => mov._id)); // Agregar todos los IDs al array
    }
  };

  const showRemoveModal = (kind, id) => {
    if (kind === "many") {
      setIsRemoveModalMany(true);
    } else {
      setTransRemovableId(id);
      setIsRemoveModal(true);
    }
  };

  const handleOkRemove = async (kind) => {
    setConfirmLoading(true);
    if (kind === "many") {
      await handleRemoveManyTransactions(selectedTrans);
    } else {
      if (transRemovableId) {
        await handleTransactionRemove(transRemovableId);
      } else {
        console.log(transRemovableId);
        runNotify("warning", "No transaction selected to remove");
      }
    }
  };

  const handleCancel = (kind) => {
    if (kind === "many") {
      setIsRemoveModalMany(false);
    } else {
      setIsRemoveModal(false);
    }
  };

  return (
    <div className="w-full h-full pt-5">
      <div className={"edit-modal-cont"}>{editModal}</div>
      <div className={`edit-multi-modal-cont`}>{editMultiModal}</div>
      <div className="remove-modal-container">
        <Modal
          title="Warning"
          open={isRemoveModal}
          onOk={() => handleOkRemove()}
          onCancel={() => handleCancel()}
          confirmLoading={confirmLoading}
        >
          <p>Are you sure you want to remove? 🤔</p>
        </Modal>
        <Modal
          title="Warning"
          open={isRemoveModalMany}
          onOk={() => handleOkRemove("many")}
          onCancel={() => handleCancel("many")}
          confirmLoading={confirmLoading}
        >
          <p>
            Are you sure you want to remove{" "}
            {selectedTrans.length > 0 ? `"${selectedTrans.length}" items` : ""}?
            🤔
          </p>
        </Modal>
      </div>
      <div className="movement-content">
        <h1 className="movement-title text-2xl text-center font-bold">
          Transactions details
        </h1>
      </div>
      <p className="text-center font-xl">Filters</p>
      <div className="filters flex items-center justify-center gap-2">
        <div
          className={`clear-allbtn text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight  relative pulse-animation-short cursor-pointer ${
            isSelectionMode ? "text-purple-500" : ""
          }`}
          onClick={handeTransSelection}
        >
          <p className="pr-2">Select {isSelectionMode ? "ON" : ""}</p>
          <HiMiniCursorArrowRipple size={15} />
        </div>
        <div className="w-fit text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short">
          <select
            className="bg-transparent appearance-none w-full pr-4 "
            name="DateSelector"
            value={timePeriod}
            onChange={handleDurationChange}
          >
            <option value={2}>Yesterday</option>
            <option value={7}>Las week</option>
            <option value={15}>Las 15 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
          </select>
          <div className="filterIconContainer absolute right-[0px] pointer-events-none">
            <UniversalCategoIcon type={"md/MdOutlineArrowDownward"} siz={12} />
          </div>
        </div>
        <div className="w-fit text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short">
          <select
            className="bg-transparent appearance-none w-full pr-4"
            name="DateSelector"
            value={trastType}
            onChange={handleTransType}
          >
            <option value={"all"}>All transactions</option>
            <option value={"incomes"}>All incomes</option>
            <option value={"bills"}>All bills</option>
          </select>
          <div className="filterIconContainer absolute right-[0px] pointer-events-none">
            <UniversalCategoIcon type={"md/MdOutlineArrowDownward"} siz={12} />
          </div>
        </div>
        <div className="w-fit text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short">
          <select
            className="bg-transparent appearance-none pr-4 max-w-[30px]"
            name="DateSelector"
            value={readable}
            onChange={handleReadable}
          >
            <option value={"all"}>All</option>
            <option value={"true"}>Readable transactions</option>
            <option value={"false"}>Not readable transactions</option>
          </select>
          <div className="filterIconContainer absolute right-[0px] pointer-events-none">
            <UniversalCategoIcon type={"md/MdOutlineArrowDownward"} siz={12} />
          </div>
        </div>
        <div
          className="clear-allbtn text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight  relative pulse-animation-short"
          onClick={handleCleanFilter}
        >
          <p className="pr-2">Clear filters</p>
          <UniversalCategoIcon type={"ai/AiOutlineClear"} siz={13} />
        </div>
      </div>
      <div className="head">
      </div>
      {loadingComponent ? (
        <div className="w-full h-full flex justify-center items-center">
          <Skeleton active />
        </div>
      ) : !allMovements.length > 0 ? (
        <div className="w-full h-full flex justify-center items-center">
          <EmptyModule emMessage={"No transactions here... 🤕"} />
        </div>
      ) : (
        <div className="table-container w-full overflow-y-scroll relative">
          <div className="bg-slate-50 text-slate-700 sticky z-50 top-0 border-b-2 border-slate-200 px-1 py-2 mb-1">
            <div className="flex flex-row justify-between items-center first-line:font-semibold ">
              <div className="flex gap-1">
                <div>Category</div>
                <div>Name</div>
              </div>
              <div>Amount</div>
            </div>
            {!isSelectionMode ? (
              ""
            ) : (
              <div className="selectionHeader flex gap-2 justify-between items-center py-1.5 bg-purple-50 text-[13px]">
                <div
                  className="flex gap-1 left-0  items-center justify-center text-purple-500 cursor-pointer"
                  onClick={() => handeTransSelection()}
                >
                  <HiMiniCursorArrowRipple size={20} />
                  <div className=" w-fit flex items-center justify-start border-2 border-purple-500 rounded-full ">
                    <p className="pr-2">Off</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-4 items-align justify-center">
                  <div
                    className=" text-purple-500 flex gap-1 justify-center items-center cursor-pointer"
                    onClick={() => handleSelectedAll()}
                  >
                    <p>Select All</p>
                    <IoCheckmarkDoneCircleOutline size={17} />
                  </div>
                  <p>Selected items {`"${selectedTrans.length}"`}</p>
                  <Tooltip title="The selector mode allows you to select multiple transactions by just clicking on them or selecting all the transactions. After selection, you can remove all your selections or edit the date or specific sections of the transaction 🤓">
                    <div className="flex items-center justify-center">
                      <UniversalCategoIcon
                        type={`${"fa/FaRegQuestionCircle"}`}
                        siz={15}
                      />
                    </div>
                  </Tooltip>
                </div>
                <div className="btns flex justify-between gap-2 text-[15px]">
                  <button
                    onClick={() => showRemoveModal("many", selectedTrans)}
                    className={`hover:text-red-700 micro-pulse`}
                  >
                    <CategoIcon type={"MdDelete"} size={20} className="" />
                  </button>
                  <button
                    onClick={() => handleMultiTransEdit(selectedTrans)}
                    className="hover:text-blue-700 micro-pulse"
                  >
                    <CategoIcon
                      type={"MdOutlineCreate"}
                      size={20}
                      className=""
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="movements-container flex flex-col gap-2 ">
            {allMovements.map((movement) => (
              <div
                key={movement._id}
                id={`trans-${movement._id}`}
                className={`flex flex-row justify-between items-center bg-slate-50 rounded-2xl py-1 px-2 hover:bg-slate-200 relative`}
              >
                <div className="flex gap-2 items-center">
                  <div
                    className={`editor-cont ${isSelectionMode ? "" : "hidden"}`}
                  >
                    <div
                      className="w-full h-full absolute top-0 left-0"
                      onClick={() => handleSelectedItem(movement._id)}
                    ></div>
                  </div>
                  <div className="tra-cat-cont">
                    <div
                      style={{
                        backgroundColor: movement.category?.color || "#DADADA",
                      }}
                      className={`circle-ico w-[50px] h-[50px] rounded-full flex items-center justify-center hover:mix-blend-multiply`}
                    >
                      {!movement.category ? (
                        <UniversalCategoIcon
                          type={`${"md/MdFilterNone"}`}
                          size={10}
                        />
                      ) : !movement.category.icon ? (
                        <UniversalCategoIcon
                          type={"md/MdFilterNone"}
                          size={10}
                        />
                      ) : (
                        <UniversalCategoIcon
                          type={`${movement.category.icon}`}
                          size={10}
                        />
                      )}
                    </div>
                  </div>
                  <div className="">
                    <div className="center-cont flex flex-col">
                      <div className="tra-text font-medium">
                        {!movement.name ? (
                          <p className="tra-nameless">No name. Asign one...</p>
                        ) : (
                          <div className="tra-center-cont ">
                            <p className="tra-name text-start">
                              {movement?.name}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="tra-acount-cont text-[10px] font-normal">
                        {!movement.account ? (
                          <p className=" text-start">No account...</p>
                        ) : (
                          <p className=" text-start">
                            {movement.account?.name}
                          </p>
                        )}
                      </div>
                      <div className="tra-tag-cont flex flex-wrap gap-1 items-center justify-start text-[10px] font-thin">
                        <p className="font-light">Tags: </p>
                        {!movement.tags ? (
                          <p>No tags...</p>
                        ) : (
                          movement.tags.map((tag) => (
                            <Tag tag={tag} key={tag._id} size={8} />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="">
                  <div className="tra-amount flex flex-col gap-[1px] w-fit items-end justify-end">
                    {movement.isBill ? (
                      <div className="flex flex-col items-end">
                        <div className="tra-amount-cont text-red-500 flex gap-1 items-center font-medium">
                          <CategoIcon type={"MdKeyboardDoubleArrowDown"} />
                          <p className="tra-amount ">
                            {currencyFormatter.format(movement.amount, {
                              locale: "en-US",
                            })}
                          </p>
                        </div>
                        <div className="date-container text-[12px] font-light">
                          {dayjs(movement.date || movement.createdAt).format(
                            "DD/MM/YYYY"
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="tra-amount-cont text-green-500 flex gap-1 items-center font-medium">
                          <CategoIcon type={"MdKeyboardDoubleArrowUp"} />
                          <p className="tra-amount ">
                            {currencyFormatter.format(movement.amount, {
                              locale: "en-US",
                            })}
                          </p>
                        </div>
                        <div className="date-container text-[12px] font-light">
                          {dayjs(movement.date || movement.createdAt).format(
                            "DD/MM/YYYY"
                          )}
                        </div>
                      </div>
                    )}
                    {/* <div className="date-container text-[12px] font-light">
                      {dayjs(movement.date || movement.createdAt).format(
                        "DD/MM/YYYY"
                      )}
                    </div> */}
                    <div className="btns flex justify-between gap-2">
                      <button
                        onClick={() => showRemoveModal("", movement._id)}
                        className={`hover:text-slate-700 micro-pulse`}
                      >
                        <CategoIcon type={"MdDelete"} size={15} className="" />
                      </button>
                      <button
                        onClick={() => handleTransEdit(movement)}
                        className="hover:text-slate-700 micro-pulse"
                      >
                        <CategoIcon
                          type={"MdOutlineCreate"}
                          size={15}
                          className=""
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Movements;
