import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { adminApi, AdminUser } from '@/services/adminApi';
import { Search, User, Mail } from 'lucide-react-native';

interface UserAutocompleteProps {
  placeholder?: string;
  onUserSelect: (user: AdminUser) => void;
  onTextChange?: (text: string) => void;
  initialValue?: string;
  style?: any;
}

export default function UserAutocomplete({
  placeholder = "Kullanıcı ara...",
  onUserSelect,
  onTextChange,
  initialValue = "",
  style,
}: UserAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null as any);

  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true);
      
      // Debounce search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await adminApi.searchUsers(query, 8) as AdminUser[];
          setSuggestions(results);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('[UserAutocomplete] Search error:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleTextChange = (text: string) => {
    setQuery(text);
    onTextChange?.(text);
  };

  const handleUserSelect = (user: AdminUser) => {
    setQuery(user.email);
    setShowSuggestions(false);
    onUserSelect(user);
  };

  const handleKeyPress = (e: any) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.nativeEvent.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleUserSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };



  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Text key={index} style={styles.highlightedText}>
          {part}
        </Text>
      ) : part
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <Search size={20} color="#9aa4bf" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#5f6a86"
          value={query}
          onChangeText={handleTextChange}
          onKeyPress={handleKeyPress}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow selection
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
        />
        {loading && (
          <ActivityIndicator size="small" color="#4C6FFF" style={styles.loadingIcon} />
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((user, index) => (
            <TouchableOpacity
              key={user.id}
              style={[
                styles.suggestionItem,
                index === selectedIndex && styles.suggestionItemSelected
              ]}
              onPress={() => handleUserSelect(user)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionContent}>
                <View style={styles.suggestionHeader}>
                  <User size={16} color="#9aa4bf" />
                  <Text style={styles.suggestionName}>
                    {highlightMatch(user.name || user.username || 'Kullanıcı', query)}
                  </Text>
                </View>
                <View style={styles.suggestionEmail}>
                  <Mail size={14} color="#6f7899" />
                  <Text style={styles.suggestionEmailText}>
                    {highlightMatch(user.email, query)}
                  </Text>
                </View>
                <Text style={styles.suggestionCountry}>
                  Unknown
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showSuggestions && suggestions.length === 0 && query.length >= 2 && !loading && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>
            &quot;{query}&quot; için kullanıcı bulunamadı
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101015',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23263a',
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 0,
  },
  loadingIcon: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#101015',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23263a',
    maxHeight: 300,
    zIndex: 1001,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1d2e',
  },
  suggestionItemSelected: {
    backgroundColor: '#1a1d2e',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  suggestionEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  suggestionEmailText: {
    fontSize: 12,
    color: '#9aa4bf',
    flex: 1,
  },
  suggestionCountry: {
    fontSize: 11,
    color: '#6f7899',
    marginTop: 2,
  },
  highlightedText: {
    backgroundColor: '#4C6FFF',
    color: '#fff',
    fontWeight: '700',
  },
  noResults: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#101015',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23263a',
    padding: 16,
    zIndex: 1001,
  },
  noResultsText: {
    fontSize: 14,
    color: '#9aa4bf',
    textAlign: 'center',
  },
});
