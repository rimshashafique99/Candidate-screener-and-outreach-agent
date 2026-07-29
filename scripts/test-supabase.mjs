import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from("job_descriptions")
  .insert({ title: "Test JD", description: "Test description" })
  .select();

console.log({ data, error });