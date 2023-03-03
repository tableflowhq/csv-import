package util

import (
	"bytes"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

func JsonPrettyPrint(in string) string {
	var out bytes.Buffer
	err := json.Indent(&out, []byte(in), "", "\t")
	if err != nil {
		return in
	}
	return out.String()
}

func IsValidJSON(str string) bool {
	var js json.RawMessage
	return json.Unmarshal([]byte(str), &js) == nil
}

// FillTemplateValues replaces template keys with the provided values
// Format examples: ${name} ${new.name} ${old.name}
func FillTemplateValues(template string, values map[string]interface{}) string {
	result := template
	rex := regexp.MustCompile(`\${(\w+|\w+\.\w+)}`)
	matches := rex.FindAllStringSubmatch(template, -1)
	for _, match := range matches {
		token := match[0]
		tokenValue := match[1]
		// Replace the value even if it doesn't exist in the values map
		value, exists := values[tokenValue]
		if !exists {
			value = ""
		}
		result = strings.ReplaceAll(result, token, fmt.Sprintf("%v", value))
	}
	return result
}

func GetTriggerDropSQL(schema, table string) string {
	template := fmt.Sprintf(`
	drop trigger if exists pg_notify_trigger_event_%[1]s_%[2]s_update on %[1]s.%[2]s;
	drop trigger if exists pg_notify_trigger_event_%[1]s_%[2]s_insert on %[1]s.%[2]s;
	drop trigger if exists pg_notify_trigger_event_%[1]s_%[2]s_delete on %[1]s.%[2]s;
	drop function if exists pg_notify_trigger_event_%[1]s_%[2]s();
	`, schema, table)
	return template
}

func GetTriggerCreationSQL(schema, table string) string {
	template := fmt.Sprintf(`
	do
	$$
	    begin
	        if not exists(select 1 from pg_proc where proname = 'pg_notify_trigger_event_%[1]s_%[2]s') then
	            create or replace function pg_notify_trigger_event_%[1]s_%[2]s() returns trigger as
	            $FN$
	            declare
	                hasNew  bool = false;
	                hasOld  bool = false;
	                payload jsonb;
	            begin
	                if TG_OP = 'INSERT' then
	                    hasNew = true;
	                elseif TG_OP = 'UPDATE' then
	                    hasNew = true;
	                    hasOld = true;
	                else
	                    hasOld = true;
	                end if;
	                payload = jsonb_build_object(
	                        'table', TG_TABLE_NAME,
	                        'schema', TG_TABLE_SCHEMA,
	                        'event', to_jsonb(TG_OP),
	                        'user', current_user
	                    );
	                if hasNew then
	                    payload = jsonb_set(payload, '{new}', to_jsonb(NEW), true);
	                end if;
	                if hasOld then
	                    payload = jsonb_set(payload, '{old}', to_jsonb(OLD), true);
	                end if;
	                perform pg_notify('pg_notify_trigger_event', payload::text);
	                return NEW;
	            end;
	            $FN$ language plpgsql;
	        end if;
	        if not exists(select 1 from pg_trigger where tgname = 'pg_notify_trigger_event_%[1]s_%[2]s_update') then
	            create trigger pg_notify_trigger_event_%[1]s_%[2]s_update
	                after update
	                on %[1]s.%[2]s
	                for each row
	            execute procedure pg_notify_trigger_event_%[1]s_%[2]s();
	        end if;
	        if not exists(select 1 from pg_trigger where tgname = 'pg_notify_trigger_event_%[1]s_%[2]s_insert') then
	            create trigger pg_notify_trigger_event_%[1]s_%[2]s_insert
	                after insert
	                on %[1]s.%[2]s
	                for each row
	            execute procedure pg_notify_trigger_event_%[1]s_%[2]s();
	        end if;
	        if not exists(select 1 from pg_trigger where tgname = 'pg_notify_trigger_event_%[1]s_%[2]s_delete') then
	            create trigger pg_notify_trigger_event_%[1]s_%[2]s_delete
	                after delete
	                on %[1]s.%[2]s
	                for each row
	            execute procedure pg_notify_trigger_event_%[1]s_%[2]s();
	        end if;
	    end
	$$;`, schema, table)
	return template
}
