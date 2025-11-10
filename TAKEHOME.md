# Build a Simple Version of Notion

In this exercise, you'll create a super simple version of Notion — one where there are only two types of blocks (text and images) and they always display vertically down a page. If you're not familiar with Notion, watch this [short video here](https://www.youtube.com/watch?v=aA7si7AmPkY).

## Requirements (in order of importance)

1. **Implement a simple app which loads and displays text and image blocks**

   > ☝️ Please feel free to use any library, **EXCEPT** a text-editor library like Tiptap, BlockNote, etc — one of the points of this exercise is to implement some frontend controls for editing, and using a text editor library basically does that part of the exercise for you.

2. **Implement adding a new text or image block to the list, and persist the new blocks to a backend datastore**
   - For text, you should be able to customize the **value of the text blocks** and whether it's an **H1, H2, H3, or paragraph**
   - For images, you should be able to customize the **height, width, and image source**
   - You can use any data store you wish (anything from CSV to Postgres). Please don't use a backend-as-a-service platform like Firebase or Supabase for this

3. **Implement editing existing text or image blocks**

## Important Notes

You're not really meant to finish the whole thing — just get as far as you can! Make sure to take the following into account:

1. **Data should persist on the backend** (e.g. we recommend SQLite, JSON, or CSV file just so it's easier for testing, but you can use any persistence strategy you want EXCEPT for backend-as-a-service platforms) and be accessed via an API

   > ☝️ Please do NOT use a backend-as-a-service platform like Firebase, Supabase, etc for this exercise. This is a full-stack exercise, so we want to see a frontend you wrote interacting with a backend you wrote.

2. Make sure to use all the tools available to you, so that you're not caught up in implementing boilerplate for an hour

3. [Surprise us](https://www.youtube.com/watch?v=DjjWW-YQCC8&ab_channel=SandwichConQueso)! Want to add some bells and whistles? If you're looking for ideas on what to implement if you finish early, please don't spend more than one hour on this — it's pretty obvious when people do, and we don't want you to waste time (or ours by unfortunately having to reject your submission)

   Ideas:
   - Add other block types in Notion (e.g. https://www.notion.so/help/guides/types-of-content-blocks)
   - Implement undo/redo
   - Implement real-time editing
