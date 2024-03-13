import dbConnection from "./dbConnection";
import Category from "@/model/Category";

export default async function defCategoriesCreator() {
  try {
    //Collection
    const allDefaultCategories = [
      {
        name: "House",
        icon: "md/MdOutlineHouse",
        color: "#DCE775",
      },
      {
        name: "Car",
        icon: "fa/FaCar",
        color: "#26A69A",
      },
      {
        name: "Transport",
        icon: "md/MdOutlineDirectionsSubwayFilled",
        color: "#8D6E63",
      },
      {
        name: "Education",
        icon: "md/MdSchool",
        color: "#2196F3",
      },
      {
        name: "Restaurant",
        icon: "md/MdOutlineFastfood",
        color: "#FFEE58",
      },
      {
        name: "Food",
        icon: "md/MdRestaurant",
        color: "#F57C00",
      },
      {
        name: "Clothes",
        icon: "gi/GiClothes",
        color: "#FFECB3",
      },
      {
        name: "Entertainment",
        icon: "md/MdLocalMovies",
        color: "#4DD0E1",
      },
      {
        name: "E-accounts",
        icon: "fa/FaAmazon",
        color: "#8E24AA",
      },
      {
        name: "Incomes",
        icon: "gi/GiReceiveMoney",
        color: "#29B6F6",
      },
      {
        name: "Savings",
        icon: "gi/GiMoneyStack",
        color: "#C5E1A5",
      },
      {
        name: "Travel",
        icon: "fa/FaPlane",
        color: "#81D4FA",
      },
      {
        name: "Health",
        icon: "gi/GiHeartPlus",
        color: "#EF9A9A",
      },
      {
        name: "Aesthetic",
        icon: "gi/GiHeartPlus",
        color: "#F48FB1",
      },
      {
        name: "Taxes",
        icon: "gi/GiTakeMyMoney",
        color: "#EF5350",
      },
    ];
    // const allDefaultSubCategories = [
    //   {
    //     name: "House",
    //     icon: "md/MdOutlineHouse",
    //     color: "#DCE775",
    //     fatherCategory: ,
    //   }
    // ]
    //Connection
    await dbConnection();
    // If exist already:
    // const defCatArray = [];
    const categoryCreationPromises = allDefaultCategories.map(async (defCat) => {
        const existingCategory = await Category.findOne({ name: defCat.name });
        if (!existingCategory) {
          const newDefCat = new Category({
            name: defCat.name,
            icon: defCat.icon,
            color: defCat.color,
            isDefaultCatego: true
        });
          return newDefCat.save();
        }
      });
      // Esto ejecutará todas las operaciones de creación en paralelo
      const allRessults = await Promise.all(categoryCreationPromises);
      return allRessults

    //Creation of SubCategories:
    // const publicTransport =
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

// Creation from default categories:
// const house = new DefaultCategory({
//   name: "House",
//   icon: "md/MdOutlineHouse",
//   color: "#DCE775",
// });
// const car = new DefaultCategory({
//   name: "Car",
//   icon: "md/MdOutlineHouse",
//   color: "#26A69A",
// });
// const transport = new DefaultCategory({
//   name: "Transport",
//   icon: "md/MdOutlineDirectionsSubwayFilled",
//   color: "#8D6E63",
// });
// const education = new DefaultCategory({
//   name: "Education",
//   icon: "md/MdSchool",
//   color: "#2196F3",
// });
// const restaurants = new DefaultCategory({
//   name: "Restaurant",
//   icon: "md/MdOutlineFastfood",
//   color: "#FFEE58",
// });
// const food = new DefaultCategory({
//   name: "Food",
//   icon: "md/MdRestaurant",
//   color: "#F57C00",
// });
// const clothes = new DefaultCategory({
//   name: "Clothes",
//   icon: "gi/GiClothes",
//   color: "#FFECB3",
// });
// const entertainment = new DefaultCategory({
//   name: "Entertainment",
//   icon: "bi/BiSolidCameraMovie",
//   color: "#4DD0E1",
// });
// const eAccounts = new DefaultCategory({
//   name: "E-accounts",
//   icon: "fa/FaAmazon",
//   color: "#8E24AA",
// });
// const incomes = new DefaultCategory({
//   name: "Incomes",
//   icon: "gi/GiReceiveMoney",
//   color: "#29B6F6",
// });
// const savings = new DefaultCategory({
//   name: "Savings",
//   icon: "gi/GiMoneyStack",
//   color: "#C5E1A5",
// });
// const travel = new DefaultCategory({
//   name: "Travel",
//   icon: "fa/FaPlane",
//   color: "#81D4FA",
// });
// const health = new DefaultCategory({
//   name: "Health",
//   icon: "gi/GiHeartPlus",
//   color: "#EF9A9A",
// });
// const aesthetic = new DefaultCategory({
//   name: "Aesthetic",
//   icon: "gi/GiHeartPlus",
//   color: "#F48FB1",
// });
// const taxes = new DefaultCategory({
//   name: "Taxes",
//   icon: "gi/GiTakeMyMoney",
//   color: "#EF5350",
// });
