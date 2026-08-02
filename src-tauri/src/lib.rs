use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::Emitter;

#[derive(Serialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("读取失败 {}: {}", path, e))
}

#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }
    }
    fs::write(&path, content).map_err(|e| format!("保存失败 {}: {}", path, e))
}

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();
    let dir = fs::read_dir(&path).map_err(|e| format!("打开目录失败 {}: {}", path, e))?;
    for entry in dir.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
        entries.push(FileEntry {
            name,
            path: entry.path().to_string_lossy().to_string(),
            is_dir,
        });
    }
    // 文件夹在前,按名称排序
    entries.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(entries)
}

#[tauri::command]
fn save_asset(dir: String, filename: String, base64_data: String) -> Result<String, String> {
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(base64_data.as_bytes())
        .map_err(|e| format!("base64 解码失败: {}", e))?;
    let dir_path = std::path::Path::new(&dir);
    if !dir_path.exists() {
        fs::create_dir_all(dir_path).map_err(|e| format!("创建目录失败: {}", e))?;
    }
    let full = dir_path.join(&filename);
    fs::write(&full, bytes).map_err(|e| format!("写入图片失败: {}", e))?;
    Ok(full.to_string_lossy().to_string())
}

#[tauri::command]
fn list_files_recursive(dir: String, limit: usize) -> Result<Vec<FileEntry>, String> {
    let mut out = Vec::new();
    let root = std::path::Path::new(&dir);
    if !root.exists() {
        return Ok(out);
    }
    let skip = [".git", "node_modules", "target", "dist", ".vscode", ".idea", ".obsidian", "yymd-assets"];
    let mut stack = vec![root.to_path_buf()];
    while let Some(d) = stack.pop() {
        let entries = match fs::read_dir(&d) {
            Ok(e) => e,
            Err(_) => continue,
        };
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.') {
                continue;
            }
            let path = entry.path();
            let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
            if is_dir {
                if !skip.contains(&name.as_str()) {
                    stack.push(path);
                }
            } else {
                let lower = name.to_lowercase();
                if lower.ends_with(".md") || lower.ends_with(".markdown") || lower.ends_with(".mdown") {
                    out.push(FileEntry {
                        name,
                        path: path.to_string_lossy().to_string(),
                        is_dir: false,
                    });
                    if out.len() >= limit {
                        return Ok(out);
                    }
                }
            }
        }
    }
    Ok(out)
}

fn settings_path() -> Result<std::path::PathBuf, String> {
    let base = dirs::config_dir().ok_or_else(|| "无法获取配置目录".to_string())?;
    let dir = base.join("yymd");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("创建配置目录失败: {}", e))?;
    }
    Ok(dir.join("settings.json"))
}

#[tauri::command]
fn load_settings() -> String {
    settings_path()
        .ok()
        .and_then(|p| fs::read_to_string(p).ok())
        .unwrap_or_else(|| "{}".to_string())
}

#[tauri::command]
fn save_settings(json: String) -> Result<(), String> {
    let path = settings_path()?;
    fs::write(path, json).map_err(|e| format!("保存设置失败: {}", e))
}

#[tauri::command]
fn show_in_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    let result = std::process::Command::new("open").arg(path).spawn();
    #[cfg(target_os = "windows")]
    let result = std::process::Command::new("explorer")
        .arg(format!("/select,{}", path))
        .spawn();
    #[cfg(all(unix, not(target_os = "macos")))]
    let result = std::process::Command::new("xdg-open")
        .arg(Path::new(&path).parent().unwrap_or(Path::new(".")))
        .spawn();
    result.map(|_| ()).map_err(|e| format!("打开失败: {}", e))
}

fn build_menu(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let new_i = MenuItem::with_id(app, "file.new", "新建", true, Some("CmdOrCtrl+N"))?;
    let open_i = MenuItem::with_id(app, "file.open", "打开…", true, Some("CmdOrCtrl+O"))?;
    let save_i = MenuItem::with_id(app, "file.save", "保存", true, Some("CmdOrCtrl+S"))?;
    let save_as_i = MenuItem::with_id(app, "file.save_as", "另存为…", true, Some("Shift+CmdOrCtrl+S"))?;
    let export_html_i = MenuItem::with_id(app, "file.export_html", "导出为 HTML", true, None::<&str>)?;
    let export_pdf_i = MenuItem::with_id(app, "file.export_pdf", "导出为 PDF…", true, None::<&str>)?;
    let quit_i = PredefinedMenuItem::quit(app, Some("退出"))?;
    let file_menu = Submenu::with_items(
        app,
        "文件",
        true,
        &[&new_i, &open_i, &save_i, &save_as_i, &export_html_i, &export_pdf_i, &quit_i],
    )?;

    let undo_i = PredefinedMenuItem::undo(app, Some("撤销"))?;
    let redo_i = PredefinedMenuItem::redo(app, Some("重做"))?;
    let cut_i = PredefinedMenuItem::cut(app, Some("剪切"))?;
    let copy_i = PredefinedMenuItem::copy(app, Some("复制"))?;
    let paste_i = PredefinedMenuItem::paste(app, Some("粘贴"))?;
    let select_all_i = PredefinedMenuItem::select_all(app, Some("全选"))?;
    let edit_menu = Submenu::with_items(
        app,
        "编辑",
        true,
        &[&undo_i, &redo_i, &cut_i, &copy_i, &paste_i, &select_all_i],
    )?;

    let menu = Menu::with_items(app, &[&file_menu, &edit_menu])?;
    app.set_menu(menu)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            build_menu(app.handle()).expect("failed to build menu");
            Ok(())
        })
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            if id.starts_with("file.") {
                let _ = app.emit(&format!("menu://{}", id), ());
            }
        })
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            write_text_file,
            list_dir,
            load_settings,
            save_settings,
            show_in_folder,
            save_asset,
            list_files_recursive
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
