import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import createSupabaseServerClient, { createSupabaseAdminClient } from "@/app/lib/supabase/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail) return NextResponse.json({ error: "Admin access is not configured" }, { status: 500 });
    if (user.email?.trim().toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: "Image uploads are not configured" }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.type === "image/svg+xml" || /\.svgz?$/i.test(file.name) ||
        (!file.type.startsWith("image/") && !(file.type === "" && /\.(?:jpe?g|png|webp|gif|avif|heic|heif|tiff?|bmp|ico)$/i.test(file.name)))) {
      return NextResponse.json({ error: "Choose a supported image file (SVG is not accepted)" }, { status: 415 });
    }
    if (!file.size) {
      return NextResponse.json({ error: "Image is empty" }, { status: 400 });
    }

    // Convert the file to a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary using a stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "portfolio", resource_type: "image" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    }) as any;

    // Insert into Supabase `media` table
    const admin = await createSupabaseAdminClient();
    const { data, error } = await admin
      .from("media")
      .insert([
        {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
          secure_url: uploadResult.secure_url,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
          alt_text: file.name,
          folder: "portfolio",
        }
      ])
      .select()
      .single();

    if (error) {
      await cloudinary.uploader.destroy(uploadResult.public_id).catch(() => {});
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to upload" }, { status: 500 });
  }
}
